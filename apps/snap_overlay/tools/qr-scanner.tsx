import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createTimer } from "@solid-primitives/timer";
import type { Accessor } from "solid-js";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { clamp } from "@/shared/libs/clamp";
import { RegionCaptureApi, type RegionCaptureParams } from "@/shared/tauri/region_capture_api";
const DEFAULT_QR_SIZE = 240;
const MIN_QR_SIZE = 120;
const MAX_QR_SIZE = 820;
const QR_SIZE_STEP = 20;
const CAPTURE_PADDING = 100;
const SCAN_INTERVAL_MS = 220;
const STATIC_FRAME_RESAMPLE_MS = 2000;
const POSITION_THRESHOLD_PX = 16;
const RECENT_PAYLOAD_CACHE_SIZE = 6;
const RECENT_PAYLOAD_TTL_MS = 30_000;

export type QrScannerFrame = {
  size: number;
  center: { x: number; y: number };
};

export type CreateQrScannerOptions = {
  isActive: Accessor<boolean>;
  onScanSuccess: (content: string) => Promise<void> | void;
  onScanFailure?: () => Promise<void> | void;
};

export type QrScannerInstance = {
  frame: Accessor<QrScannerFrame | undefined>;
  isScanning: Accessor<boolean>;
};

const clampCenterToViewport = (x: number, y: number, size: number) => {
  const half = size / 2;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minX = half;
  const minY = half;
  const maxX = Math.max(half, width - half);
  const maxY = Math.max(half, height - half);
  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  };
};

export function createQrScanner(options: CreateQrScannerOptions): QrScannerInstance {
  const [qrSize, setQrSize] = createSignal(DEFAULT_QR_SIZE);
  const [qrCenter, setQrCenter] = createSignal({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = createSignal(false);
  const recentPayloads: Array<{ value: string; timestamp: number }> = [];

  let lastScanAt = 0;
  let lastScanFrame: QrScannerFrame | undefined;

  const isActive = () => untrack(() => options.isActive());

  const updateQrCenter = (x: number, y: number, size = qrSize()) => {
    setQrCenter(clampCenterToViewport(x, y, size));
  };

  const adjustQrSize = (delta: number) => {
    setQrSize((prev) => {
      const next = clamp(prev + delta, MIN_QR_SIZE, MAX_QR_SIZE);
      setQrCenter((pos) => clampCenterToViewport(pos.x, pos.y, next));
      return next;
    });
  };

  const throttleAdjust = throttle(adjustQrSize, 32);

  const prunePayloadCache = (now: number) => {
    const cutoff = now - RECENT_PAYLOAD_TTL_MS;
    while (recentPayloads.length && recentPayloads[0]!.timestamp < cutoff) {
      recentPayloads.shift();
    }
    if (recentPayloads.length > RECENT_PAYLOAD_CACHE_SIZE) {
      recentPayloads.splice(0, recentPayloads.length - RECENT_PAYLOAD_CACHE_SIZE);
    }
  };

  const isPayloadRecent = (payload: string, now: number) => {
    prunePayloadCache(now);
    return recentPayloads.some((entry) => entry.value === payload);
  };

  const rememberPayload = (payload: string, now: number) => {
    recentPayloads.push({ value: payload, timestamp: now });
    prunePayloadCache(now);
  };

  const shouldScanFrame = (currentFrame: QrScannerFrame, now: number) => {
    if (!lastScanFrame) return true;
    const dx = currentFrame.center.x - lastScanFrame.center.x;
    const dy = currentFrame.center.y - lastScanFrame.center.y;
    const distance = Math.hypot(dx, dy);
    const sizeDiff = Math.abs(currentFrame.size - lastScanFrame.size);

    if (distance >= POSITION_THRESHOLD_PX || sizeDiff >= POSITION_THRESHOLD_PX) {
      return true;
    }
    return now - lastScanAt >= STATIC_FRAME_RESAMPLE_MS;
  };

  const getCaptureParams = (): RegionCaptureParams => {
    const size = Math.round(qrSize());
    const center = qrCenter();
    const half = size / 2;

    const padding = CAPTURE_PADDING;

    const halfWithPadding = half + padding;

    let left = center.x - halfWithPadding;
    let top = center.y - halfWithPadding;

    const paddedSize = size + padding * 2;

    if (typeof window !== "undefined") {
      const maxLeft = Math.max(0, window.innerWidth - paddedSize);
      const maxTop = Math.max(0, window.innerHeight - paddedSize);

      left = clamp(left, 0, maxLeft);
      top = clamp(top, 0, maxTop);
    }

    return {
      x: Math.max(0, Math.round(left)),
      y: Math.max(0, Math.round(top)),
      width: paddedSize,
      height: paddedSize,
    };
  };

  const detectAndScan = async (force = false) => {
    if (!isActive() || isScanning()) {
      return;
    }

    const now = new Date().getTime();
    const currentFrame: QrScannerFrame = {
      size: qrSize(),
      center: qrCenter(),
    };

    if (!force && !shouldScanFrame(currentFrame, now)) {
      return;
    }

    setIsScanning(true);
    lastScanAt = now;
    lastScanFrame = currentFrame;

    try {
      const params = getCaptureParams();

      const result = await RegionCaptureApi.scanRegionQr(params);
      if (!result) {
        await options.onScanFailure?.();
        return;
      }

      if (isPayloadRecent(result, now)) {
        return;
      }

      rememberPayload(result, now);
      await options.onScanSuccess(result);
    } finally {
      setIsScanning(false);
    }
  };

  const frame = createMemo<QrScannerFrame | undefined>(() => ({
    size: qrSize(),
    center: qrCenter(),
  }));

  createTimer(
    () => {
      recentPayloads.splice(0);
      void untrack(() => detectAndScan());
    },
    SCAN_INTERVAL_MS,
    setInterval,
  );

  createEffect(() => {
    if (!options.isActive()) {
      setIsScanning(false);
      return;
    }

    setQrSize(DEFAULT_QR_SIZE);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    updateQrCenter(centerX, centerY, DEFAULT_QR_SIZE);
  });

  createEventListener(window, "keydown", (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      adjustQrSize(QR_SIZE_STEP);
    }

    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      adjustQrSize(-QR_SIZE_STEP);
    }
  });

  createEventListener(window, "pointermove", (event: MouseEvent) => {
    if (!isActive()) {
      return;
    }

    updateQrCenter(event.clientX, event.clientY);
  });

  createEventListener(window, "wheel", (event: WheelEvent) => {
    if (!isActive()) {
      return;
    }
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    throttleAdjust(direction * QR_SIZE_STEP);
  });

  return {
    frame,
    isScanning,
  };
}

export function QrScanner(props: { frame: Accessor<QrScannerFrame> }) {
  const styles = createMemo(() => ({
    width: `${props.frame().size}px`,
    height: `${props.frame().size}px`,
    left: `${props.frame().center.x - props.frame().size / 2}px`,
    top: `${props.frame().center.y - props.frame().size / 2}px`,
  }));

  const borderWidth = createMemo(() => `${clamp(Math.round(props.frame().size / 48), 4, 8)}px`);

  return (
    <div class="absolute pointer-events-none animate-qr-pulse" style={styles()}>
      <div class="absolute inset-0 rounded-[15%] shadow-[0_0_0_9999px_var(--color-backdrop)]" />

      <div
        class="absolute w-[25%] h-[25%] border-t-card border-l-card rounded-tl-[70%]"
        style={{
          top: `-${borderWidth()}`,
          left: `-${borderWidth()}`,
          "border-top-width": borderWidth(),
          "border-left-width": borderWidth(),
        }}
      />
      <div
        class="absolute w-[25%] h-[25%] border-t-card border-r-card rounded-tr-[70%]"
        style={{
          top: `-${borderWidth()}`,
          right: `-${borderWidth()}`,
          "border-top-width": borderWidth(),
          "border-right-width": borderWidth(),
        }}
      />
      <div
        class="absolute w-[25%] h-[25%] border-b-card border-l-card rounded-bl-[70%]"
        style={{
          bottom: `-${borderWidth()}`,
          left: `-${borderWidth()}`,
          "border-bottom-width": borderWidth(),
          "border-left-width": borderWidth(),
        }}
      />
      <div
        class="absolute w-[25%] h-[25%] border-b-card border-r-card rounded-br-[70%]"
        style={{
          bottom: `-${borderWidth()}`,
          right: `-${borderWidth()}`,
          "border-bottom-width": borderWidth(),
          "border-right-width": borderWidth(),
        }}
      />
    </div>
  );
}

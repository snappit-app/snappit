import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createTimer } from "@solid-primitives/timer";
import type { Accessor } from "solid-js";
import { createEffect, createMemo, createSignal, For, untrack } from "solid-js";

import { clamp } from "@/shared/libs/clamp";
import { RegionCaptureApi, type RegionCaptureParams } from "@/shared/tauri/region_capture_api";
const DEFAULT_QR_SIZE = 240;
const MIN_QR_SIZE = 120;
const MAX_QR_SIZE = 620;
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

  const updateQrCenter = (x: number, y: number, size: number) => {
    setQrCenter(clampCenterToViewport(x, y, size));
  };

  const throttleCenter = throttle(updateQrCenter, 16);

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
    throttleCenter(centerX, centerY, DEFAULT_QR_SIZE);
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

    console.log(event.clientX, "event.clientX");
    console.log(event.clientY, "event.clientY");
    throttleCenter(event.clientX, event.clientY, qrSize());
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

  const borderWidth = createMemo(() => clamp(Math.round(props.frame().size / 48), 4, 8));

  const arcPaths = createMemo(() => {
    const { size } = props.frame();
    const stroke = borderWidth();
    const radiusMax = Math.max(size / 2 - stroke, stroke);
    const radius = Math.max(Math.min(size * 0.12, radiusMax), stroke);
    const inset = stroke / 4;

    const h = stroke / 2;
    const i = inset;

    const topLeft = `M ${i + radius} ${i - h} A ${radius} ${radius} 0 0 0 ${i - h} ${i + radius}`;
    const topRight = `M ${size - i - radius} ${i - h} A ${radius} ${radius} 0 0 1 ${size - i + h} ${i + radius}`;
    const bottomLeft = `M ${i - h} ${size - i - radius} A ${radius} ${radius} 0 0 0 ${i + radius} ${size - i + h}`;
    const bottomRight = `M ${size - i + h} ${size - i - radius} A ${radius} ${radius} 0 0 1 ${size - i - radius} ${size - i + h}`;

    return {
      size,
      paths: [topLeft, topRight, bottomLeft, bottomRight],
    };
  });

  return (
    <div class="absolute pointer-events-none animate-qr-pulse" style={styles()}>
      <div class="absolute inset-0 rounded-[12%] shadow-[0_0_0_9999px_var(--color-backdrop)]" />
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute bottom-[10%] left-[12%] h-[18%] w-[28%] rounded-full" />
        <div class="absolute bottom-[10%] right-[12%] h-[18%] w-[28%] rounded-full" />
      </div>

      <svg
        class="absolute inset-0 overflow-visible"
        viewBox={`0 0 ${arcPaths().size} ${arcPaths().size}`}
        xmlns="http://www.w3.org/2000/svg"
        stroke="white"
        stroke-width={borderWidth()}
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
        filter="url(#cornerShadow)"
      >
        <defs>
          <filter id="cornerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="black" flood-opacity="0.6" />
          </filter>
        </defs>
        <For each={arcPaths().paths}>{(d) => <path d={d} />}</For>
      </svg>
    </div>
  );
}

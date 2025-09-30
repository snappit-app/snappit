import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createTimer } from "@solid-primitives/timer";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { clamp } from "@/shared/libs/clamp";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";

import {
  DEFAULT_QR_SIZE,
  MAX_QR_SIZE,
  MIN_QR_SIZE,
  POSITION_THRESHOLD_PX,
  QR_SIZE_STEP,
  RECENT_PAYLOAD_CACHE_SIZE,
  RECENT_PAYLOAD_TTL_MS,
  SCAN_INTERVAL_MS,
  STATIC_FRAME_RESAMPLE_MS,
} from "./lib/consts";
import { createQrScannerOptions, qrFrame, qrScannerInstance } from "./lib/models";
import { createRecentPayloadCache } from "./lib/payload";
import { clampCenterToViewport, getCaptureParams } from "./lib/utils";

export function createQrScanner(options: createQrScannerOptions): qrScannerInstance {
  const payloadCache = createRecentPayloadCache(RECENT_PAYLOAD_TTL_MS, RECENT_PAYLOAD_CACHE_SIZE);
  const [qrSize, setQrSize] = createSignal(DEFAULT_QR_SIZE);
  const [qrCenter, setQrCenter] = createSignal({ x: 0, y: 0 });
  const [isScanning, setIsScanning] = createSignal(false);
  const frame = createMemo<qrFrame>(() => ({ size: qrSize(), center: qrCenter() }));
  const isActive = () => untrack(() => options.isActive());

  let lastScanAt = 0;
  let lastScanFrame: qrFrame | undefined;

  const updateQrCenter = throttle((x: number, y: number, size: number) => {
    setQrCenter(clampCenterToViewport(x, y, size));
  }, 12);

  const adjustQrSize = throttle((delta: number) => {
    setQrSize((prev) => {
      const next = clamp(prev + delta, MIN_QR_SIZE, MAX_QR_SIZE);
      setQrCenter((pos) => clampCenterToViewport(pos.x, pos.y, next));
      return next;
    });
  }, 16);

  const shouldScanFrame = (currentFrame: qrFrame, now: number) => {
    if (!isActive() || isScanning()) return false;
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

  const detectAndScan = async (force = false, captureParams?: RegionCaptureParams) => {
    const now = new Date().getTime();

    if (!force && !shouldScanFrame(frame(), now)) {
      return;
    }

    setIsScanning(true);
    lastScanAt = now;
    lastScanFrame = frame();

    try {
      const params = captureParams ?? getCaptureParams(frame());

      const result = await RegionCaptureApi.scanRegionQr(params);

      console.log(result);

      if (!result.payload) {
        await options.onScanFailure?.();
        return;
      }

      if (payloadCache.isRecent(result.payload, now)) {
        return;
      }

      payloadCache.remember(result.payload, now);
      await options.onScanSuccess(result.payload);
      return result;
    } finally {
      setIsScanning(false);
    }
  };

  createTimer(() => detectAndScan(), SCAN_INTERVAL_MS, setInterval);

  createEffect(() => {
    if (!options.isActive()) {
      setIsScanning(false);
      return;
    }
    payloadCache.reset();
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

    updateQrCenter(event.clientX, event.clientY, qrSize());
  });

  createEventListener(window, "wheel", (event: WheelEvent) => {
    if (!isActive()) {
      return;
    }
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    adjustQrSize(direction * QR_SIZE_STEP);
  });

  return {
    frame,
    isScanning,
    scan: (frame: RegionCaptureParams) => {
      return detectAndScan(true, frame);
    },
  };
}

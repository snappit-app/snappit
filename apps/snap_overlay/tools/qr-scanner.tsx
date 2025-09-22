import { createEventListener } from "@solid-primitives/event-listener";
import type { Accessor, JSX } from "solid-js";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { RegionCaptureApi, type RegionCaptureParams } from "@/shared/tauri/region_capture_api";
const DEFAULT_QR_SIZE = 240;
const MIN_QR_SIZE = 120;
const MAX_QR_SIZE = 820;
const QR_SIZE_STEP = 20;

export type QrScannerFrame = {
  style: JSX.CSSProperties;
  cornerLength: number;
  cornerRadius: number;
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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const clampCenterToViewport = (x: number, y: number, size: number) => {
  if (typeof window === "undefined") {
    return { x, y };
  }
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

  const getCaptureParams = (): RegionCaptureParams => {
    const size = Math.round(qrSize());
    const center = qrCenter();
    const half = size / 2;
    let left = center.x - half;
    let top = center.y - half;

    if (typeof window !== "undefined") {
      const maxLeft = Math.max(0, window.innerWidth - size);
      const maxTop = Math.max(0, window.innerHeight - size);
      left = clamp(left, 0, maxLeft);
      top = clamp(top, 0, maxTop);
    }

    return {
      x: Math.max(0, Math.round(left)),
      y: Math.max(0, Math.round(top)),
      width: size,
      height: size,
    };
  };

  const detectAndScan = async () => {
    console.log(isActive());
    if (!isActive()) {
      return;
    }

    setIsScanning(true);
    const params = getCaptureParams();

    const result = await RegionCaptureApi.scanRegionQr(params);

    console.log(result);
    setIsScanning(false);
    if (result) {
      await options.onScanSuccess(result);
    }
  };

  const frame = createMemo<QrScannerFrame | undefined>(() => {
    if (!options.isActive()) return undefined;
    const size = qrSize();
    const center = qrCenter();

    const style: JSX.CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      left: `${center.x - size / 2}px`,
      top: `${center.y - size / 2}px`,
    };

    const cornerLength = clamp(Math.round(size * 0.25), 24, 64);
    const cornerRadius = clamp(Math.round(cornerLength / 2.5), 6, 18);

    return {
      style,
      cornerLength,
      cornerRadius,
    };
  });

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

  createEventListener(window, "pointerup", (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isScanning()) {
      detectAndScan();
    }
  });

  createEventListener(window, "keydown", (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_") {
      event.preventDefault();
      adjustQrSize(QR_SIZE_STEP);
    }

    if (event.key.toLocaleLowerCase() === "enter" && !isScanning()) {
      detectAndScan();
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
    adjustQrSize(direction * QR_SIZE_STEP);
  });

  return {
    frame,
    isScanning,
  };
}

export function QrScanner(props: { frame: Accessor<QrScannerFrame> }) {
  const cornerSize = createMemo(() => `${props.frame().cornerLength}px`);
  const cornerRadiusPx = createMemo(() => `${props.frame().cornerRadius}px`);
  const cornerColor = "rgba(255, 255, 255, 0.9)";
  const cornerThickness = 3;

  return (
    <div class="absolute pointer-events-none" style={props.frame().style}>
      <div
        class="absolute inset-0"
        style={{
          "border-radius": cornerRadiusPx(),
          "box-shadow": "0 0 0 9999px rgba(0,0,0,0.35)",
        }}
      />

      <div
        class="absolute"
        style={{
          width: cornerSize(),
          height: cornerSize(),
          top: "0",
          left: "0",
          "border-top": `${cornerThickness}px solid ${cornerColor}`,
          "border-left": `${cornerThickness}px solid ${cornerColor}`,
          "border-top-left-radius": cornerRadiusPx(),
        }}
      />
      <div
        class="absolute"
        style={{
          width: cornerSize(),
          height: cornerSize(),
          top: "0",
          right: "0",
          "border-top": `${cornerThickness}px solid ${cornerColor}`,
          "border-right": `${cornerThickness}px solid ${cornerColor}`,
          "border-top-right-radius": cornerRadiusPx(),
        }}
      />
      <div
        class="absolute"
        style={{
          width: cornerSize(),
          height: cornerSize(),
          bottom: "0",
          left: "0",
          "border-bottom": `${cornerThickness}px solid ${cornerColor}`,
          "border-left": `${cornerThickness}px solid ${cornerColor}`,
          "border-bottom-left-radius": cornerRadiusPx(),
        }}
      />
      <div
        class="absolute"
        style={{
          width: cornerSize(),
          height: cornerSize(),
          bottom: "0",
          right: "0",
          "border-bottom": `${cornerThickness}px solid ${cornerColor}`,
          "border-right": `${cornerThickness}px solid ${cornerColor}`,
          "border-bottom-right-radius": cornerRadiusPx(),
        }}
      />
    </div>
  );
}

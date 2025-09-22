import { createEventListener } from "@solid-primitives/event-listener";
import type { Accessor } from "solid-js";
import { createEffect, createMemo, createSignal, untrack } from "solid-js";

import { RegionCaptureApi, type RegionCaptureParams } from "@/shared/tauri/region_capture_api";
const DEFAULT_QR_SIZE = 240;
const MIN_QR_SIZE = 120;
const MAX_QR_SIZE = 820;
const QR_SIZE_STEP = 20;
const CAPTURE_PADDING = 100;

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

  const detectAndScan = async () => {
    if (!isActive()) {
      return;
    }

    setIsScanning(true);
    const params = getCaptureParams();

    const result = await RegionCaptureApi.scanRegionQr(params);

    setIsScanning(false);
    if (result) {
      await options.onScanSuccess(result);
    }
  };

  const frame = createMemo<QrScannerFrame | undefined>(() => ({
    size: qrSize(),
    center: qrCenter(),
  }));

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
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      adjustQrSize(QR_SIZE_STEP);
    }

    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      adjustQrSize(-QR_SIZE_STEP);
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
  const styles = createMemo(() => ({
    width: `${props.frame().size}px`,
    height: `${props.frame().size}px`,
    left: `${props.frame().center.x - props.frame().size / 2}px`,
    top: `${props.frame().center.y - props.frame().size / 2}px`,
  }));

  return (
    <div class="absolute pointer-events-none animate-qr-pulse" style={styles()}>
      <div class="absolute inset-0 rounded-[18%] shadow-[0_0_0_9999px_var(--color-backdrop)]" />

      <div class="absolute top-0 left-0 w-[25%] h-[25%] border-t-[5px] border-t-card border-l-[5px] border-l-card rounded-tl-[70%]" />
      <div class="absolute top-0 right-0 w-[25%] h-[25%] border-t-[5px] border-t-card border-r-[5px] border-r-card rounded-tr-[70%]" />
      <div class="absolute bottom-0 left-0 w-[25%] h-[25%] border-b-[5px] border-b-card border-l-[5px] border-l-card rounded-bl-[70%]" />
      <div class="absolute bottom-0 right-0 w-[25%] h-[25%] border-b-[5px] border-b-card border-r-[3px] border-r-card rounded-br-[70%]" />
    </div>
  );
}

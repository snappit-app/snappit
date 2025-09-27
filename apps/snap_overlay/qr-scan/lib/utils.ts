import { clamp } from "@/shared/libs/clamp";
import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";

import { CAPTURE_PADDING } from "./consts";
import { qrFrame } from "./models";

export const clampCenterToViewport = (x: number, y: number, size: number) => {
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

export const getCaptureParams = (frame: qrFrame): RegionCaptureParams => {
  const size = Math.round(frame.size);
  const center = frame.center;
  const half = size / 2;

  const padding = CAPTURE_PADDING;

  const halfWithPadding = half + padding;

  let left = center.x - halfWithPadding;
  let top = center.y - halfWithPadding;

  const paddedSize = size + padding * 2;

  const maxLeft = Math.max(0, window.innerWidth - paddedSize);
  const maxTop = Math.max(0, window.innerHeight - paddedSize);

  left = clamp(left, 0, maxLeft);
  top = clamp(top, 0, maxTop);

  return {
    x: Math.max(0, Math.round(left)),
    y: Math.max(0, Math.round(top)),
    width: paddedSize,
    height: paddedSize,
  };
};

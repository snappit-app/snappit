import { invoke } from "@tauri-apps/api/core";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function captureRegion(params: RegionCaptureParams) {
  // Returns a data URL string: "data:image/png;base64,...."
  return invoke<string>("region_capture", { params });
}

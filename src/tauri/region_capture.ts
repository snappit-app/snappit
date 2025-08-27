import { invoke } from "@tauri-apps/api/core";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function captureRegion(params: RegionCaptureParams) {
  return invoke("region_capture", { params });
}

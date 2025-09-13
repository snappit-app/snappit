import { invoke } from "@tauri-apps/api/core";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class RegionCaptureApi {
  static async recognizeRegionText(params: RegionCaptureParams) {
    return invoke("recognize_region_text", { params });
  }
}

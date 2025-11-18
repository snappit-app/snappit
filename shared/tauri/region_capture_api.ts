import { invoke } from "@tauri-apps/api/core";

import { SnappitQrResponse, SnappitResponse } from "@/shared/tauri/snappit_res";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class RegionCaptureApi {
  static async onCapture(params: RegionCaptureParams) {
    return invoke<SnappitResponse>("on_capture", { params });
  }

  static async scanRegionQr(params: RegionCaptureParams) {
    return invoke<SnappitQrResponse>("scan_region_qr", { params });
  }

  static async getLastShotDim() {
    return invoke<[number, number]>("get_last_shot_dim");
  }

  static async getLastShotData(): Promise<Blob> {
    const res = await fetch("img://current", {
      method: "GET",
    });

    return res.blob();
  }
}

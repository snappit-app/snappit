import { invoke } from "@tauri-apps/api/core";

import {
  SnappitOcrResponse,
  SnappitQrResponse,
  SnappitResponse,
} from "@/shared/tauri/snappit_res";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class RegionCaptureApi {
  static async onSmartTool(params: RegionCaptureParams) {
    return invoke<SnappitResponse>("on_smart_tool", { params });
  }

  static async recognizeRegionText(params: RegionCaptureParams) {
    return invoke<SnappitOcrResponse>("recognize_region_text", { params });
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

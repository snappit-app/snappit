import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { onScanSuccess } from "@/apps/snap_overlay/qr-scan";
import { NotificationCenter } from "@/shared/notifications/notification_center";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

export async function onTextRecognized(text: string) {
  if (text) {
    await writeText(text);
    await NotificationCenter.notifyOcr(text);
  }
}

export async function onAreaSelected(selection: RegionCaptureParams, smartMode = false) {
  SnapOverlayApi.close();

  if (smartMode) {
    const res = await RegionCaptureApi.onSmartTool(selection);
    console.log(res);

    switch (res.kind) {
      case "qr":
        return onScanSuccess(res.payload);
      case "ocr":
      default:
        return onTextRecognized(res.payload);
    }
  }
  const text = await RegionCaptureApi.recognizeRegionText(selection);
  onTextRecognized(text.payload);
}

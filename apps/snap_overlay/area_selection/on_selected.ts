import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { onColorRecognized } from "@/apps/snap_overlay/color_dropper/on_recognized";
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

export async function onAreaSelected(selection: RegionCaptureParams) {
  SnapOverlayApi.hide();

  const res = await RegionCaptureApi.onCapture(selection);

  switch (res.kind) {
    case "qr":
      return onScanSuccess(res.payload);
    case "ocr":
      return onTextRecognized(res.payload);
    case "dropper":
      return onColorRecognized(res.payload);
    default:
      return;
  }
}

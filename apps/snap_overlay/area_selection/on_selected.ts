import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { NotificationCenter } from "@/shared/notifications/notification_center";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

export async function onAreaSelected(selection: RegionCaptureParams, smartMode = false) {
  SnapOverlayApi.close();

  const text = await RegionCaptureApi.recognizeRegionText(selection);

  if (text) {
    await writeText(text);
    await NotificationCenter.notifyOcr(text);
  }
}

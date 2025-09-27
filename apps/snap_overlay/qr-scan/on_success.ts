import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";

import { normalizeHttpUrl } from "@/shared/libs/normalize_url";
import { NotificationCenter } from "@/shared/notifications/notification_center";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

export async function onScanSuccess(content: string) {
  const normalizedUrl = normalizeHttpUrl(content);

  if (normalizedUrl) {
    try {
      await openUrl(normalizedUrl);
      await NotificationCenter.notifyQr(`Opened: ${normalizedUrl}`);
    } catch (err) {
      console.error("Failed to open QR URL", err);
      await writeText(content);
      await NotificationCenter.notifyQr(`Copied: ${content}`);
    }
  } else {
    await writeText(content);
    await NotificationCenter.notifyQr(`Copied: ${content}`);
  }

  SnapOverlayApi.close();
}

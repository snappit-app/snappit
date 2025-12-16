import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";
import { load } from "@tauri-apps/plugin-store";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { normalizeHttpUrl } from "@/shared/libs/normalize_url";
import { NotificationCenter } from "@/shared/notifications";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

async function getAutoOpenUrls(): Promise<boolean> {
  const store = await load(SNAPPIT_CONSTS.store.file);
  const autoOpen = await store.get<boolean>(SNAPPIT_CONSTS.store.keys.qr_auto_open_urls);
  return autoOpen ?? false;
}

export async function onScanSuccess(content: string) {
  const normalizedUrl = normalizeHttpUrl(content);
  const autoOpenUrls = await getAutoOpenUrls();

  if (normalizedUrl && autoOpenUrls) {
    try {
      await openUrl(normalizedUrl);
      await NotificationCenter.notifyQrOnUrl(`${normalizedUrl}`);
    } catch (err) {
      console.error("Failed to open QR URL", err);
      await writeText(content);
      await NotificationCenter.notifyQrOnCopied(`${content}`);
    }
  } else {
    await writeText(content);
    await NotificationCenter.notifyQrOnCopied(`${content}`);
  }

  SnapOverlayApi.hide();
}

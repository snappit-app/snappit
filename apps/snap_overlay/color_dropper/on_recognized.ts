import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { NotificationCenter } from "@/shared/notifications/notification_center";
import { ColorInfo } from "@/shared/tauri/screen_capture_api";

export async function onColorRecognized(color: ColorInfo) {
  if (color) {
    await writeText(color.hex);
    await NotificationCenter.notifyDropper(color.hex);
  }
}

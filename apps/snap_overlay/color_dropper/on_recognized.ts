import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { NotificationCenter } from "@/shared/notifications";
import { ColorInfo } from "@/shared/tauri/screen_capture_api";

export async function onColorRecognized(color: ColorInfo, formattedColor: string) {
  if (color) {
    await writeText(formattedColor);
    await NotificationCenter.notifyDropper(formattedColor, color.hex);
  }
}

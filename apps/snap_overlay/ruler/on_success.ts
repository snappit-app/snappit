import { writeText } from "@tauri-apps/plugin-clipboard-manager";

import { NotificationCenter } from "@/shared/notifications";

export async function onRulerSuccess(body: string) {
  if (body) {
    await writeText(body);
    await NotificationCenter.notifyRuler(body);
  }
}

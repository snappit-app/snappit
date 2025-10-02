import { isPermissionGranted, sendNotification } from "@tauri-apps/plugin-notification";

export abstract class NotificationCenter {
  static async notifyQr(body: string) {
    if (await isPermissionGranted()) {
      sendNotification({
        title: "TextSnap — QR",
        body,
      });
    }
  }

  static async notifyOcr(body: string) {
    if (await isPermissionGranted()) {
      sendNotification({
        title: "TextSnap",
        body: `Copied: ${body}`,
      });
    }
  }

  static async notifyDropper(body: string) {
    if (await isPermissionGranted()) {
      sendNotification({
        title: "TextSnap - Color recognized",
        body: `Copied: ${body}`,
      });
    }
  }
}

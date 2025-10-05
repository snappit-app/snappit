import { isPermissionGranted, sendNotification } from "@tauri-apps/plugin-notification";

import { NotificationSettings } from "@/shared/notifications/settings";

export abstract class NotificationCenter {
  private static async canNotify() {
    if (!(await NotificationSettings.isEnabled())) {
      return false;
    }

    if (!(await isPermissionGranted())) {
      return false;
    }

    return true;
  }

  static async notifyQr(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "TextSnap — QR",
        body,
      });
    }
  }

  static async notifyOcr(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "TextSnap",
        body: `Copied: ${body}`,
      });
    }
  }

  static async notifyDropper(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "TextSnap - Color recognized",
        body: `Copied: ${body}`,
      });
    }
  }

  static async notifyRuler(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "TextSnap - Ruler",
        body: `Copied: ${body}`,
      });
    }
  }
}

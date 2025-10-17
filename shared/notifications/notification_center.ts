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
        title: "Snappit — QR",
        body,
      });
    }
  }

  static async notifyOcr(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "Snappit",
        body: `Copied: ${body}`,
      });
    }
  }

  static async notifyDropper(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "Snappit - Color recognized",
        body: `Copied: ${body}`,
      });
    }
  }

  static async notifyRuler(body: string) {
    if (await this.canNotify()) {
      sendNotification({
        title: "Snappit - Ruler",
        body: `Copied: ${body}`,
      });
    }
  }
}

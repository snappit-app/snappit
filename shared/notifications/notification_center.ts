import { NotificationSettings } from "@/shared/notifications/settings";
import { NotificationApi } from "@/shared/tauri/notification_api";

export abstract class NotificationCenter {
  private static async canNotify() {
    return await NotificationSettings.isEnabled();
  }

  static async notifyQrOnUrl(body: string) {
    if (await this.canNotify()) {
      return await NotificationApi.show({ value: body, data: "on_url", target: "qr_scanner" });
    }
  }

  static async notifyQrOnCopied(body: string) {
    if (await this.canNotify()) {
      return await NotificationApi.show({ value: body, data: "on_copied", target: "qr_scanner" });
    }
  }

  static async notifyOcr(body: string) {
    if (await this.canNotify()) {
      return await NotificationApi.show({ value: body, target: "capture" });
    }
  }

  static async notifyDropper(body: string, hexColor: string) {
    if (await this.canNotify()) {
      return await NotificationApi.show({ value: body, data: hexColor, target: "color_dropper" });
    }
  }

  static async notifyRuler(body: string) {
    if (await this.canNotify()) {
      return await NotificationApi.show({ value: body, target: "digital_ruler" });
    }
  }
}

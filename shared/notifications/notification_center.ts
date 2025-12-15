import { NotificationApi } from "@/shared/tauri/notification_api";

export abstract class NotificationCenter {
  static async notifyQrOnUrl(body: string) {
    return await NotificationApi.show({ value: body, data: "on_url", target: "qr_scanner" });
  }

  static async notifyQrOnCopied(body: string) {
    return await NotificationApi.show({ value: body, data: "on_copied", target: "qr_scanner" });
  }

  static async notifyOcr(body: string) {
    return await NotificationApi.show({ value: body, target: "capture" });
  }

  static async notifyDropper(body: string, hexColor: string) {
    return await NotificationApi.show({ value: body, data: hexColor, target: "color_dropper" });
  }

  static async notifyRuler(body: string) {
    return await NotificationApi.show({ value: body, target: "digital_ruler" });
  }
}

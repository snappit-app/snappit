import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export interface ShowPayload {
  target: SnappitOverlayTarget;
  value: string;
  data?: string;
}

export abstract class NotificationApi {
  static async get() {
    return WebviewWindow.getByLabel(SNAPPIT_CONSTS.windows.notification);
  }

  static async onShown(handler: EventCallback<ShowPayload>) {
    const window = await this.get();
    return window?.listen("notification:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("notification:hidden", handler);
  }

  static async show(payload: ShowPayload) {
    return invoke("show_notification", { payload });
  }

  static async hide() {
    return invoke("hide_notification");
  }
}

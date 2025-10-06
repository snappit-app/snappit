import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";

export abstract class SettingsApi {
  static async get() {
    return WebviewWindow.getByLabel(TEXT_SNAP_CONSTS.windows.settings);
  }

  static async onShown(handler: EventCallback<boolean>) {
    const window = await this.get();
    return window?.listen("settings:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("settings:hidden", handler);
  }
}

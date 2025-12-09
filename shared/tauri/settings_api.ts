import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { SNAPPIT_CONSTS } from "@/shared/constants";

export abstract class SettingsApi {
  static async get() {
    return WebviewWindow.getByLabel(SNAPPIT_CONSTS.windows.settings);
  }

  static async onShown(handler: EventCallback<boolean>) {
    const window = await this.get();
    return window?.listen("settings:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("settings:hidden", handler);
  }

  static async onOpenTab(handler: EventCallback<string>) {
    const window = await this.get();
    return window?.listen("settings:open_tab", handler);
  }
}

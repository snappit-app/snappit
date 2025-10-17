import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";

export abstract class SnapOverlayApi {
  static async get() {
    return WebviewWindow.getByLabel(SNAPPIT_CONSTS.windows.overlay);
  }

  static async close() {
    return invoke("hide_snap_overlay");
  }

  static async show(target: SnappitOverlayTarget) {
    return invoke("show_snap_overlay", { target });
  }

  static async unregisterHideShortcut() {
    await unregister(HIDE_SNAP_OVERLAY_SHORTCUT);
  }

  static async registerHideShortcut() {
    const registered = await isRegistered(HIDE_SNAP_OVERLAY_SHORTCUT);
    if (!registered) {
      await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
        if (e.state === "Released") SnapOverlayApi.close();
      });
    }
  }

  static async onShown(handler: EventCallback<SnappitOverlayTarget>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:hidden", handler);
  }
}

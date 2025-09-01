import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";

export const SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT = "CommandOrControl+Shift+2";
const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";

export abstract class SnapOverlayApi {
  static async getSnapOverlay() {
    return WebviewWindow.getByLabel("snap_overlay");
  }

  static async closeSnapOverlay() {
    return invoke("hide_snap_overlay");
  }

  static async showSnapOverlay() {
    return invoke("show_snap_overlay");
  }

  static async unregisterHideOverlayShortcut() {
    await unregister(HIDE_SNAP_OVERLAY_SHORTCUT);
  }

  static async unregisterShowOverlayShortcut() {
    await unregister(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT);
  }

  static async registerHideOverlayShortcut() {
    await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
      if (e.state === "Released") {
        SnapOverlayApi.closeSnapOverlay();
      }
    });
  }

  static async registerShowOverlayShortcut() {
    await register(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT, (e) => {
      if (e.state === "Pressed") {
        SnapOverlayApi.showSnapOverlay();
      }
    });
  }
}

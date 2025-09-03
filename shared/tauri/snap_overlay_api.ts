import { createStoreValue } from "@shared/store";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createMemo } from "solid-js";

const SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT = "CommandOrControl+Shift+2";
const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";

const SNAP_OVERLAY_SHORTCUT_STORE_KEY = "show_overlay";

export abstract class SnapOverlayApi {
  static async get() {
    return WebviewWindow.getByLabel("snap_overlay");
  }

  static async close() {
    return invoke("hide_snap_overlay");
  }

  static async show() {
    return invoke("show_snap_overlay");
  }

  static async unregisterHideShortcut() {
    await unregister(HIDE_SNAP_OVERLAY_SHORTCUT);
  }

  static async unregisterShortcut() {
    await unregister(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT);
  }

  static async registerHideShortcut() {
    await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
      if (e.state === "Released") {
        SnapOverlayApi.close();
      }
    });
  }

  static async registerShowShortcut() {
    return register(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT, (e) => {
      if (e.state === "Pressed") {
        SnapOverlayApi.show();
      }
    });
  }

  static createShortcut() {
    const [storeShortcut, setStoreShortcut] = createStoreValue<string>(
      SNAP_OVERLAY_SHORTCUT_STORE_KEY,
    );
    const shortcut = createMemo(() => storeShortcut() ?? SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT);

    return [shortcut, setStoreShortcut] as const;
  }
}

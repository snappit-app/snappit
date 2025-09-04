import { TextSnapStore } from "@shared/store";
import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createMemo } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";

export const SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT = "CommandOrControl+Shift+2";
const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";

export abstract class SnapOverlayApi {
  static async get() {
    return WebviewWindow.getByLabel(TEXT_SNAP_CONSTS.windows.overlay);
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

  static async unregisterShowShortcut(shortcut: string) {
    await unregister(shortcut);
  }

  static async registerHideShortcut() {
    await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
      if (e.state === "Released") {
        SnapOverlayApi.close();
      }
    });
  }

  static async registerShowShortcut(shortcut: string) {
    return register(shortcut, (e) => {
      if (e.state === "Pressed") {
        SnapOverlayApi.show();
      }
    });
  }

  static createShortcut() {
    const [storeShortcut, setStoreShortcut] = TextSnapStore.createValue<string>(
      TEXT_SNAP_CONSTS.store.keys.hotkey_capture,
    );
    const shortcut = createMemo(() => storeShortcut() ?? SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT);
    return [shortcut, setStoreShortcut] as const;
  }
}

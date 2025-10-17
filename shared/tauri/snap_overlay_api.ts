import { SnappitStore } from "@shared/store";
import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createEffect, createMemo } from "solid-js";

import { DEFAULT_SHORTCUTS, ShortcutKeys } from "@/apps/settings/shortcuts/consts";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { SnappitTrayApi } from "@/shared/tauri/snap_tray_api";

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

  static createStoredShortcut(key: ShortcutKeys, target: SnappitOverlayTarget) {
    const [storeShortcut, setStoreValue, remove] = SnappitStore.createValue<string>(key);
    const shortcut = createMemo(() => storeShortcut() ?? DEFAULT_SHORTCUTS[key]);

    createEffect(() => {
      if (!storeShortcut() && DEFAULT_SHORTCUTS[key]) {
        void setShortcut(DEFAULT_SHORTCUTS[key]);
      }
    });

    async function setShortcut(newShortcut: string) {
      await setStoreValue(newShortcut);
      await SnappitTrayApi.updateShortcut(target);
    }

    async function removeShortcut() {
      await remove();
      await SnappitTrayApi.updateShortcut(target);
    }

    return [shortcut, setShortcut, removeShortcut] as const;
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

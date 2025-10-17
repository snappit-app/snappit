import { SnappitStore } from "@shared/store";
import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createEffect, createMemo, onCleanup } from "solid-js";

import { DEFAULT_SHORTCUTS } from "@/apps/settings/shortcuts/consts";
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

  static async unregisterShowShortcut(shortcut: string) {
    return await unregister(shortcut);
  }

  static async registerHideShortcut() {
    const registered = await isRegistered(HIDE_SNAP_OVERLAY_SHORTCUT);
    if (!registered) {
      await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
        if (e.state === "Released") SnapOverlayApi.close();
      });
    }
  }

  static async registerShowShortcut(shortcut: string, target: SnappitOverlayTarget) {
    return register(shortcut, (e) => {
      if (e.state === "Pressed") {
        SnapOverlayApi.show(target);
      }
    });
  }

  static createShortcut(key: string, target: SnappitOverlayTarget) {
    const [storeShortcut] = this.createStoredShortcut(key, target);

    createEffect<string | undefined>((prev) => {
      const curr = storeShortcut();

      if (!curr.length) {
        if (prev) {
          SnapOverlayApi.unregisterShowShortcut(prev);
        }

        return;
      }

      if (prev && prev !== curr) {
        SnapOverlayApi.unregisterShowShortcut(prev);
      }

      this.registerShowShortcut(curr, target);
      SnappitTrayApi.updateShortcut(target);
      return curr;
    });

    onCleanup(() => {
      const curr = storeShortcut();
      if (curr) {
        SnapOverlayApi.unregisterShowShortcut(curr);
      }
    });
  }

  static createStoredShortcut(key: string, target: SnappitOverlayTarget) {
    const [storeShortcut, setStoreShortcut, remove] = SnappitStore.createValue<string>(key);
    const shortcut = createMemo(() => storeShortcut() ?? DEFAULT_SHORTCUTS[key]);

    createEffect(() => {
      if (!storeShortcut() && DEFAULT_SHORTCUTS[key]) {
        setStoreShortcut(DEFAULT_SHORTCUTS[key]);
      }
    });

    async function removeShortcut() {
      await remove();
      await SnappitTrayApi.updateShortcut(target);
    }

    return [shortcut, setStoreShortcut, removeShortcut] as const;
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

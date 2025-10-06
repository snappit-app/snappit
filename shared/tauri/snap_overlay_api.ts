import { TextSnapStore } from "@shared/store";
import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { isRegistered, register, unregister } from "@tauri-apps/plugin-global-shortcut";
import { createEffect, createMemo, onCleanup } from "solid-js";

import { DEFAULT_SHORTCUTS } from "@/apps/settings/shortcuts/consts";
import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { TextSnapOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { TextSnapTrayApi } from "@/shared/tauri/snap_tray_api";

const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";

export abstract class SnapOverlayApi {
  static async get() {
    return WebviewWindow.getByLabel(TEXT_SNAP_CONSTS.windows.overlay);
  }

  static async close() {
    return invoke("hide_snap_overlay");
  }

  static async show(target: TextSnapOverlayTarget) {
    return invoke("show_snap_overlay", { target });
  }

  static async hide() {
    return invoke("hide_snap_overlay");
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

  static async registerShowShortcut(shortcut: string, target: TextSnapOverlayTarget) {
    return register(shortcut, (e) => {
      if (e.state === "Pressed") {
        SnapOverlayApi.show(target);
      }
    });
  }

  static createShortcut(key: string, target: TextSnapOverlayTarget) {
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
      TextSnapTrayApi.updateShortcut(target);
      return curr;
    });

    onCleanup(() => {
      const curr = storeShortcut();
      if (curr) {
        SnapOverlayApi.unregisterShowShortcut(curr);
      }
    });
  }

  static createStoredShortcut(key: string, target: TextSnapOverlayTarget) {
    const [storeShortcut, setStoreShortcut, remove] = TextSnapStore.createValue<string>(key);
    const shortcut = createMemo(() => storeShortcut() ?? DEFAULT_SHORTCUTS[key]);

    createEffect(() => {
      if (!storeShortcut() && DEFAULT_SHORTCUTS[key]) {
        setStoreShortcut(DEFAULT_SHORTCUTS[key]);
      }
    });

    async function removeShortcut() {
      await remove();
      await TextSnapTrayApi.updateShortcut(target);
    }

    return [shortcut, setStoreShortcut, removeShortcut] as const;
  }

  static async onShown(handler: EventCallback<TextSnapOverlayTarget>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:hidden", handler);
  }
}

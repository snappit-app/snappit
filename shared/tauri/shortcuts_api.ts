import { invoke } from "@tauri-apps/api/core";
import { createEffect, createMemo } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export const DEFAULT_SHORTCUTS = SNAPPIT_CONSTS.defaults.shortcuts;
export type ShortcutKeys = keyof typeof DEFAULT_SHORTCUTS;

export const CAPTURE_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys.hotkey_capture as ShortcutKeys;
export const DIGITAL_RULER_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys
  .hotkey_digital_ruler as ShortcutKeys;
export const COLOR_DROPPER_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys
  .hotkey_color_dropper as ShortcutKeys;
export const QR_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys.hotkey_qr_scanner as ShortcutKeys;

export abstract class ShortcutsApi {
  static async syncShortcut(target: SnappitOverlayTarget) {
    return invoke("sync_shortcut", { target });
  }

  static createStoredShortcut(key: ShortcutKeys, target: SnappitOverlayTarget) {
    const [storeShortcut, setStoreValue, remove, isReady] = SnappitStore.createValue<string>(key);
    const shortcut = createMemo(() => storeShortcut() ?? DEFAULT_SHORTCUTS[key]);

    createEffect(() => {
      // Seed defaults only after store value is loaded to avoid overwriting persisted shortcuts.
      if (isReady() && storeShortcut() == null && DEFAULT_SHORTCUTS[key]) {
        void setShortcut(DEFAULT_SHORTCUTS[key]);
      }
    });

    async function setShortcut(newShortcut: string) {
      await setStoreValue(newShortcut);
      await ShortcutsApi.syncShortcut(target);
    }

    async function removeShortcut() {
      await remove();
      await ShortcutsApi.syncShortcut(target);
    }

    return [shortcut, setShortcut, removeShortcut] as const;
  }
}

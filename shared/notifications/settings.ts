import { load } from "@tauri-apps/plugin-store";
import { createEffect, createSignal } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { TextSnapStore } from "@/shared/store";

type NotificationPreference = readonly [() => boolean, (next: boolean) => void];

export abstract class NotificationSettings {
  private static readonly KEY = TEXT_SNAP_CONSTS.store.keys.notifications;
  private static _singleton: NotificationPreference | null = null;

  static create(): NotificationPreference {
    if (this._singleton) return this._singleton;

    const [storeValue, setStoreValue] = TextSnapStore.createValue<boolean>(this.KEY);
    const [enabled, setEnabled] = createSignal(true);

    createEffect(() => {
      const value = storeValue();
      if (value === undefined) return;

      if (typeof value === "boolean") {
        setEnabled(value);
      } else {
        setEnabled(true);
        if (value === null) {
          setStoreValue(true).catch(() => {});
        }
      }
    });

    function update(next: boolean) {
      setEnabled(next);
      setStoreValue(next).catch(() => {});
    }

    this._singleton = [enabled, update] as const;
    return this._singleton;
  }

  static async isEnabled(): Promise<boolean> {
    try {
      const store = await load(TEXT_SNAP_CONSTS.store.file);
      const value = await store.get<boolean>(this.KEY);
      if (typeof value === "boolean") {
        return value;
      }

      await store.set(this.KEY, true);
      await store.save();
      return true;
    } catch (err) {
      console.error(err);
      return true;
    }
  }
}

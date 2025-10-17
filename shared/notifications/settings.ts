import { load } from "@tauri-apps/plugin-store";
import { createMemo } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

type NotificationPreference = readonly [() => boolean, (next: boolean) => void];

export abstract class NotificationSettings {
  private static readonly KEY = SNAPPIT_CONSTS.store.keys.notifications;
  private static _singleton: NotificationPreference | null = null;

  static create(): NotificationPreference {
    if (this._singleton) return this._singleton;

    const [storeValue, setStoreValue] = SnappitStore.createValue<boolean>(this.KEY);

    const enabled = createMemo(() => {
      const value = storeValue();
      return !!value;
    });

    function update(next: boolean) {
      setStoreValue(next).catch(() => {});
    }

    this._singleton = [enabled, update] as const;
    return this._singleton;
  }

  static async isEnabled(): Promise<boolean> {
    try {
      const store = await load(SNAPPIT_CONSTS.store.file);
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

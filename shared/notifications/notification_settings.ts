import { load } from "@tauri-apps/plugin-store";
import { createMemo } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

type NotificationPreference = readonly [() => boolean, (next: boolean) => void];

export abstract class NotificationSettings {
  private static readonly KEY = SNAPPIT_CONSTS.store.keys.notifications;

  static create(): NotificationPreference {
    const [storeValue, setStoreValue] = SnappitStore.createValue<boolean>(this.KEY);

    const enabled = createMemo<boolean>(() => storeValue() ?? true);

    return [enabled, setStoreValue];
  }

  static async isEnabled(): Promise<boolean> {
    try {
      const store = await load(SNAPPIT_CONSTS.store.file);
      const enabled = await store.get<boolean>(this.KEY);
      if (typeof enabled === "undefined") {
        return true;
      }

      return enabled;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

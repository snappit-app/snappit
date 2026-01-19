import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { createEffect, createSignal } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

type AutostartPreference = readonly [() => boolean, (next: boolean) => void, () => boolean];

export abstract class AutostartSettings {
  private static readonly KEY = SNAPPIT_CONSTS.store.keys.autostart;
  private static _singleton: AutostartPreference | null = null;

  static create(): AutostartPreference {
    if (this._singleton) return this._singleton;

    const [storeValue, setStoreValue, , isReady] = SnappitStore.createValue<boolean>(this.KEY);
    const [enabled, setEnabled] = createSignal<boolean>(false);
    const [initialized, setInitialized] = createSignal(false);
    const [updating, setUpdating] = createSignal(false);

    let lastKnown = false;

    createEffect(() => {
      const value = storeValue();
      if (value === undefined) return;

      if (typeof value === "boolean") {
        lastKnown = value;
        setEnabled(value);
        setInitialized(true);
        return;
      }

      if (value === null) {
        void (async () => {
          try {
            const actual = await isEnabled();
            lastKnown = actual;
            setEnabled(actual);
            setInitialized(true);
            await setStoreValue(actual);
          } catch (err) {
            console.error(err);
            lastKnown = false;
            setEnabled(false);
            setInitialized(true);
            void setStoreValue(false).catch(() => {});
          }
        })();
      } else {
        lastKnown = false;
        setEnabled(false);
        setInitialized(true);
      }
    });

    function update(next: boolean) {
      if (!initialized()) return;
      if (next === lastKnown || updating()) return;

      const prev = lastKnown;
      setEnabled(next);
      setUpdating(true);

      void (async () => {
        try {
          if (next) {
            await enable();
          } else {
            await disable();
          }
        } catch (err) {
          console.error(err);
          lastKnown = prev;
          setEnabled(prev);
          setUpdating(false);
          return;
        }

        try {
          await setStoreValue(next);
          lastKnown = next;
        } catch (err) {
          console.error(err);
          lastKnown = prev;
          setEnabled(prev);
          try {
            if (prev) {
              await enable();
            } else {
              await disable();
            }
          } catch (restoreErr) {
            console.error(restoreErr);
          }
        } finally {
          setUpdating(false);
        }
      })();
    }

    this._singleton = [enabled, update, isReady] as const;
    return this._singleton;
  }
}

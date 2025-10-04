import { load, Store } from "@tauri-apps/plugin-store";
import { createResource, createRoot, Resource } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";

export abstract class TextSnapStore {
  private static _storeSingleton: {
    dispose: () => void;
    store: Resource<Store>;
  } | null = null;

  private static _valueSingletons: Map<
    string,
    {
      value: Resource<unknown | null>;
      setValue: (v: unknown) => Promise<void>;
      remove: () => Promise<void>;
    }
  > = new Map();

  static create() {
    if (!this._storeSingleton) {
      const inst = createRoot((dispose) => {
        const [store] = createResource<Store>(async () => {
          return await load(TEXT_SNAP_CONSTS.store.file);
        });

        return { store, dispose } as const;
      });

      this._storeSingleton = {
        dispose: inst.dispose,
        store: inst.store,
      };
    }

    return [this._storeSingleton.store] as const;
  }

  static createValue<T, R = unknown>(key: string) {
    const hit = this._valueSingletons.get(key);
    if (hit) {
      return [
        hit.value as Resource<T | null>,
        hit.setValue as (v: T) => Promise<void>,
        hit.remove,
      ] as const;
    }

    const inst = createRoot((dispose) => {
      const [store] = TextSnapStore.create();
      const [value, { refetch }] = createResource<T | null, Store, R>(store, async (s) => {
        return (await s.get(key)) ?? null;
      });

      async function setValue(newValue: T) {
        const s = store();
        if (!s) return;
        await s.set(key, newValue);
        await s.save();
        refetch();
      }

      async function remove() {
        const s = store();
        if (!s) return;
        await s.delete(key);
        await s.save();
        refetch();
      }

      return { value, setValue, dispose, remove } as const;
    });

    this._valueSingletons.set(key, {
      value: inst.value as Resource<unknown | null>,
      setValue: inst.setValue as (v: unknown) => Promise<void>,
      remove: inst.remove as () => Promise<void>,
    });

    return [
      inst.value as Resource<T | null>,
      inst.setValue as (v: T) => Promise<void>,
      inst.remove as () => Promise<void>,
    ] as const;
  }
}

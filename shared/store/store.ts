import { load, Store } from "@tauri-apps/plugin-store";
import { createResource, createRoot, Resource } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";

export abstract class SnappitStore {
  private static _storeSingleton: {
    dispose: () => void;
    store: Resource<Store>;
  } | null = null;

  private static _valueSingletons: Map<
    string,
    {
      value: Resource<unknown | null>;
      setValue: (v: unknown) => Promise<void>;
      refetch: () => Promise<unknown | null>;
      remove: () => Promise<void>;
      loading: () => boolean;
    }
  > = new Map();

  static create() {
    if (!this._storeSingleton) {
      const inst = createRoot((dispose) => {
        const [store] = createResource<Store>(async () => {
          return await load(SNAPPIT_CONSTS.store.file);
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
        hit.loading as () => boolean,
      ] as const;
    }

    const inst = createRoot((dispose) => {
      const [store] = SnappitStore.create();
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

      const loading = () => value.loading;

      return { value, setValue, dispose, remove, refetch, loading } as const;
    });

    this._valueSingletons.set(key, {
      value: inst.value as Resource<unknown | null>,
      setValue: inst.setValue as (v: unknown) => Promise<void>,
      refetch: inst.refetch as () => Promise<unknown | null>,
      remove: inst.remove as () => Promise<void>,
      loading: inst.loading as () => boolean,
    });

    return [
      inst.value as Resource<T | null>,
      inst.setValue as (v: T) => Promise<void>,
      inst.remove as () => Promise<void>,
      inst.loading as () => boolean,
    ] as const;
  }

  static async sync() {
    const [storeResource] = SnappitStore.create();
    const store = storeResource();
    if (!store) return;

    await store.reload({ ignoreDefaults: true });

    for (const [key, singleton] of this._valueSingletons) {
      const storeValue = (await store.get<unknown>(key)) ?? null;
      const currentValue = singleton.value();

      if (!this._areValuesEqual(currentValue, storeValue)) {
        await singleton.refetch();
      }
    }
  }

  private static _areValuesEqual(first: unknown, second: unknown) {
    const normalizedFirst = this._normalizeValue(first);
    const normalizedSecond = this._normalizeValue(second);

    if (Object.is(normalizedFirst, normalizedSecond)) return true;

    try {
      return JSON.stringify(normalizedFirst) === JSON.stringify(normalizedSecond);
    } catch {
      return false;
    }
  }

  private static _normalizeValue(value: unknown) {
    return value === undefined ? null : value;
  }
}

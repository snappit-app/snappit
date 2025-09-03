import { load, Store } from "@tauri-apps/plugin-store";
import { createResource } from "solid-js";

export const STORE_FILE = "settings.json";

export function createStore() {
  const [store] = createResource<Store>(async () => {
    return await load(STORE_FILE);
  });

  return { store } as const;
}

export function createStoreValue<T, R = unknown>(key: string) {
  const { store } = createStore();

  const [value, { mutate }] = createResource<T | null, Store, R>(store, async (s) => {
    return (await s.get(key)) ?? null;
  });

  async function setValue(newValue: T) {
    const s = store();
    if (!s) return;
    await s.set(key, newValue);
    await s.save();
    mutate(() => newValue);
  }

  return [value, setValue] as const;
}

import type { UnlistenFn } from "@tauri-apps/api/event";
import { createRoot, createSignal, onCleanup, onMount } from "solid-js";

import { PermissionsApi, type PermissionsState } from "@/shared/tauri/permissions_api";

type PermissionsStore = {
  state: () => PermissionsState | null;
  loading: () => boolean;
  refresh: () => Promise<void>;
  setState: (next: PermissionsState) => void;
  dispose: () => void;
};

let singleton: PermissionsStore | null = null;

export function createPermissions() {
  if (!singleton) {
    singleton = createRoot((dispose) => {
      const [state, setState] = createSignal<PermissionsState | null>(null);
      const [loading, setLoading] = createSignal<boolean>(true);
      let unlisten: UnlistenFn | undefined;

      async function refresh() {
        setLoading(true);
        try {
          const result = await PermissionsApi.getState();
          setState(() => result);
        } catch (error) {
          console.error("Unable to load permissions state", error);
        } finally {
          setLoading(false);
        }
      }

      onMount(() => {
        void refresh();

        void PermissionsApi.onChanged((payload) => {
          setState(() => payload);
          setLoading(false);
        }).then((fn) => {
          unlisten = fn;
        });
      });

      onCleanup(() => {
        unlisten?.();
      });

      return {
        state,
        loading,
        refresh,
        setState(next: PermissionsState) {
          setState(() => next);
          setLoading(false);
        },
        dispose,
      } as const;
    });
  }

  return singleton!;
}

export type PermissionsContext = ReturnType<typeof createPermissions>;

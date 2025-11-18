import { UnlistenFn } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount } from "solid-js";

import { SettingsApi } from "@/shared/tauri/settings_api";

export function createSettingsVisible() {
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  const [windowVisible, setWindowVisible] = createSignal<boolean>(false);

  onMount(async () => {
    const settingsWindow = await SettingsApi.get();
    const isVisible = (await settingsWindow?.isVisible()) ?? false;
    setWindowVisible(isVisible);

    unlistenShown = await SettingsApi.onShown(async () => {
      setWindowVisible(true);
    });
    unlistenHidden = await SettingsApi.onHidden(async () => {
      setWindowVisible(false);
    });
  });

  onCleanup(async () => {
    if (unlistenShown) {
      unlistenShown();
    }

    if (unlistenHidden) {
      unlistenHidden();
    }
  });

  return [windowVisible] as const;
}

import { getCurrentWindow } from "@tauri-apps/api/window";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

/**
 * Creates a reactive signal that tracks window focus state.
 * Adds/removes 'window-inactive' class on document.body for CSS styling.
 */
export function createWindowFocused() {
  const [isFocused, setIsFocused] = createSignal(true);

  onMount(async () => {
    const appWindow = getCurrentWindow();

    const focused = await appWindow.isFocused();
    setIsFocused(focused);

    const unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
      setIsFocused(focused);
    });

    onCleanup(() => {
      unlistenFocus();
    });
  });

  createEffect(() => {
    if (isFocused()) {
      document.body.classList.remove("window-inactive");
    } else {
      document.body.classList.add("window-inactive");
    }
  });

  return [isFocused] as const;
}

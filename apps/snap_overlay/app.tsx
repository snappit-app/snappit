import { UnlistenFn } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount, Show } from "solid-js";

import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

import SnapOverlay from "./snap_overlay";

function App() {
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  const [windowVisible, setWindowVisible] = createSignal<boolean>(false);

  onMount(async () => {
    unlistenShown = await SnapOverlayApi.onShown(async () => {
      setWindowVisible(true);
    });
    unlistenHidden = await SnapOverlayApi.onHidden(async () => {
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

  return (
    <Show when={windowVisible()}>
      <SnapOverlay />
    </Show>
  );
}

export default App;

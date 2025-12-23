import { UnlistenFn } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount } from "solid-js";

import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export function createOverlayVisible() {
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  const [windowVisible, setWindowVisible] = createSignal<boolean>(false);
  const [target, setTarget] = createSignal<SnappitOverlayTarget>("capture");

  onMount(async () => {
    const currentTarget = await SnapOverlayApi.getCurrentTarget();
    if (currentTarget) {
      setWindowVisible(true);
      setTarget(currentTarget);
    }

    unlistenShown = await SnapOverlayApi.onShown(async (tool) => {
      setWindowVisible(true);
      setTarget(tool.payload);
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

  return [windowVisible, target] as const;
}

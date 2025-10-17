import { UnlistenFn } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount } from "solid-js";

import { NotificationApi } from "@/shared/tauri/notification_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export function createNotificationVisible() {
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  const [windowVisible, setWindowVisible] = createSignal<boolean>(false);
  const [target, setTarget] = createSignal<SnappitOverlayTarget | null>("text_capture");
  const [payload, setPayload] = createSignal<string>("asd");

  onMount(async () => {
    unlistenShown = await NotificationApi.onShown(async (event) => {
      setWindowVisible(true);
      setTarget(event.payload.target);
      setPayload(event.payload.value);
    });
    unlistenHidden = await NotificationApi.onHidden(async () => {
      setWindowVisible(false);
      setTarget(null);
      setPayload("");
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

  return [windowVisible, target, payload] as const;
}

import { UnlistenFn } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount } from "solid-js";

import { NotificationApi } from "@/shared/tauri/notification_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export function createNotificationVisible() {
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  const [windowVisible, setWindowVisible] = createSignal<boolean>(false);
  const [target, setTarget] = createSignal<SnappitOverlayTarget | null>("capture");
  const [payload, setPayload] = createSignal<string>("");
  const [data, setData] = createSignal<string | undefined>(undefined);
  const [notificationId, setNotificationId] = createSignal<number>(0);

  onMount(async () => {
    unlistenShown = await NotificationApi.onShown((event) => {
      setNotificationId((prev) => prev + 1);
      setWindowVisible(true);
      setTarget(event.payload.target);
      setPayload(event.payload.value);
      setData(event.payload.data);
    });

    unlistenHidden = await NotificationApi.onHidden(() => {
      setWindowVisible(false);
      setTarget(null);
      setPayload("");
      setData(undefined);
    });
  });

  onCleanup(() => {
    unlistenShown?.();
    unlistenHidden?.();
  });

  return [windowVisible, target, payload, data, notificationId] as const;
}

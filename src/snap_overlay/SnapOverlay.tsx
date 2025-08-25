import { createEventListenerMap } from "@solid-primitives/event-listener";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { onMount } from "solid-js";

function SnapOverlay() {
  async function close() {
    const overlay = await WebviewWindow.getByLabel("snap_overlay");
    overlay?.hide();
  }

  onMount(() => {
    createEventListenerMap(window, {
      keydown: (e) => {
        if (e.key === "Escape") close();
      },
    });
  });

  return <div class="h-full w-full bg-black opacity-50" />;
}

export default SnapOverlay;

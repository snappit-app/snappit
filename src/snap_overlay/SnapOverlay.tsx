import { createEventListenerMap } from "@solid-primitives/event-listener";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { onMount } from "solid-js";

function SnapOverlay() {
  const webview = getCurrentWebviewWindow();

  function close() {
    console.log(webview);
    webview.close();
  }

  onMount(() => {
    console.log(webview);
    createEventListenerMap(window, {
      keydown: (e) => {
        if (e.key === "Escape") close();
      },
    });
  });

  return <div class="h-full w-full bg-black opacity-30" />;
}

export default SnapOverlay;

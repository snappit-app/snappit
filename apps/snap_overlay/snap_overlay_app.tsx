import { Show } from "solid-js";

import { createOverlayVisible } from "@/shared/libs/overlay_visible";

import SnapOverlay from "./snap_overlay";

function SnapOverlayApp() {
  const [visible, target] = createOverlayVisible();

  return (
    <Show when={true}>
      <SnapOverlay target={() => "smart_tool"} />
    </Show>
  );
}

export default SnapOverlayApp;

import { Show } from "solid-js";

import { createOverlayVisible } from "@/shared/libs/overlay_visible";
import { Theme } from "@/shared/theme";

import SnapOverlay from "./snap_overlay";

function SnapOverlayApp() {
  Theme.create();
  const [visible, target] = createOverlayVisible();

  return (
    <Show when={visible()}>
      <SnapOverlay target={target} />
    </Show>
  );
}

export default SnapOverlayApp;

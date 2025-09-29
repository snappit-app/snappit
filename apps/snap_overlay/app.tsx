import { Show } from "solid-js";

import { createOverlayVisible } from "@/shared/libs/overlay_visible";

import SnapOverlay from "./snap_overlay";

function App() {
  const visible = createOverlayVisible();

  return (
    <Show when={visible()}>
      <SnapOverlay />
    </Show>
  );
}

export default App;

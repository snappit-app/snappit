import { Show } from "solid-js";

import { createOverlayVisible } from "@/shared/libs/overlay_visible";

import SnapOverlay from "./snap_overlay";

function App() {
  const [visible, target] = createOverlayVisible();

  return (
    <Show when={visible()}>
      <SnapOverlay target={target} />
    </Show>
  );
}

export default App;

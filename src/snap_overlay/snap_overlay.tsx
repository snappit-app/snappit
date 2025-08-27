import { createEventListenerMap } from "@solid-primitives/event-listener";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { createMemo, createSignal, onMount } from "solid-js";

import { captureRegion, RegionCaptureParams } from "@/tauri/region_capture";

function SnapOverlay() {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [startPos, setStartPos] = createSignal({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = createSignal({ x: 0, y: 0 });
  const params = createMemo<RegionCaptureParams>(() => ({
    x: Math.min(startPos().x, currentPos().x),
    y: Math.min(startPos().y, currentPos().y),
    width: Math.abs(currentPos().x - startPos().x),
    height: Math.abs(currentPos().y - startPos().y),
  }));

  const rectStyle = createMemo(() => ({
    left: Math.min(startPos().x, currentPos().x).toString() + "px",
    top: Math.min(startPos().y, currentPos().y).toString() + "px",
    width: Math.abs(currentPos().x - startPos().x).toString() + "px",
    height: Math.abs(currentPos().y - startPos().y).toString() + "px",
  }));

  const handleMouseDown = (e: MouseEvent) => {
    setIsSelecting(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    setIsSelecting(false);
    console.log("Capture region:", params());

    await captureRegion(params());
    close();
  };

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

  return (
    <div
      onPointerDown={handleMouseDown}
      onPointerUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      class="h-full w-full bg-black opacity-50 cursor-crosshair"
    >
      {isSelecting() && <div class="bg-white absolute pointer-events-none" style={rectStyle()} />}
    </div>
  );
}

export default SnapOverlay;

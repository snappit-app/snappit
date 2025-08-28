import { createMemo, createSignal } from "solid-js";

import { captureRegion, RegionCaptureParams } from "@/tauri/region_capture";
import { closeSnapOverlay } from "@/tauri/show_snap_overlay";

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

    await captureRegion(params());
    closeSnapOverlay();
  };

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

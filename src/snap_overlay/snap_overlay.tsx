import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { createMemo, createSignal } from "solid-js";
import { createWorker } from "tesseract.js";

import { captureRegion, RegionCaptureParams } from "@/tauri/region_capture";
import { closeSnapOverlay } from "@/tauri/show_snap_overlay";
const DEFAULT_START_POS = { x: 0, y: 0 };

function SnapOverlay() {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [startPos, setStartPos] = createSignal(DEFAULT_START_POS);
  const [currentPos, setCurrentPos] = createSignal(DEFAULT_START_POS);
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
    if (e.button === 0) {
      setIsSelecting(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isSelecting) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async (e: MouseEvent) => {
    if (e.button === 0) {
      setIsSelecting(false);
      const p = params();
      setStartPos(DEFAULT_START_POS);

      const dataUrl = await captureRegion(p);
      const worker = await createWorker(["eng", "rus"]);
      const ret = await worker.recognize(dataUrl);
      console.log(ret.data.text);
      writeText(ret.data.text);
      await worker.terminate();
      closeSnapOverlay();
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      class="h-full w-full bg-black opacity-50 cursor-crosshair"
    >
      {isSelecting() && <div class="bg-white absolute pointer-events-none" style={rectStyle()} />}
    </div>
  );
}

export default SnapOverlay;

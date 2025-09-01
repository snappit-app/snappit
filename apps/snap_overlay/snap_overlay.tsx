import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { createMemo, createSignal, onMount } from "solid-js";

import { TESSERACT_WORKER } from "@/libs/tesseract_worker";
import { RegionCaptureApi, RegionCaptureParams } from "@/tauri/region_capture";
import { SnapOverlayApi } from "@/tauri/snap_overlay_api";

const DEFAULT_POS = { x: 0, y: 0 };

function SnapOverlay() {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [startPos, setStartPos] = createSignal(DEFAULT_POS);
  const [currentPos, setCurrentPos] = createSignal(DEFAULT_POS);
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

  const handleMouseMove = async (e: MouseEvent) => {
    if (!isSelecting) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async (e: MouseEvent) => {
    if (e.button === 0) {
      setIsSelecting(false);
      const p = params();
      setStartPos(DEFAULT_POS);
      setCurrentPos(DEFAULT_POS);

      await RegionCaptureApi.captureRegion(p);

      SnapOverlayApi.closeSnapOverlay();

      const imageData = await RegionCaptureApi.getLastShotData();
      const worker = await TESSERACT_WORKER;
      const ret = await worker.recognize(imageData);

      writeText(ret.data.text);
    }
  };

  onMount(async () => {
    SnapOverlayApi.registerShowOverlayShortcut();
    await TESSERACT_WORKER;
    const overlay = await SnapOverlayApi.getSnapOverlay();
    const unlistenShown = await overlay?.listen("snap_overlay:shown", () => {
      SnapOverlayApi.registerHideOverlayShortcut();
    });
    const unlistenHidden = await overlay?.listen("snap_overlay:hidden", () => {
      SnapOverlayApi.unregisterHideOverlayShortcut();
    });

    return () => {
      SnapOverlayApi.unregisterShowOverlayShortcut();
      SnapOverlayApi.unregisterHideOverlayShortcut();

      if (unlistenShown) {
        unlistenShown();
      }

      if (unlistenHidden) {
        unlistenHidden();
      }
    };
  });

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

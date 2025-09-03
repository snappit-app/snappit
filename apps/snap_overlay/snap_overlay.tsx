import { TESSERACT_WORKER } from "@shared/libs/tesseract_worker";
import { RegionCaptureApi, RegionCaptureParams } from "@shared/tauri/region_capture";
import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { createMemo, createSignal, onMount } from "solid-js";
import { RecognizeResult } from "tesseract.js";
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

      SnapOverlayApi.close();

      const imageData = await RegionCaptureApi.getLastShotData();
      const worker = await TESSERACT_WORKER;

      let res: RecognizeResult | null = null;
      worker.recognize(imageData).then(async (recognized) => {
        res = recognized;
        writeText(recognized.data.text);
        if (await isPermissionGranted()) {
          sendNotification({ title: "TextSnap", body: "Text was copied to the clipboard" });
        }
      });

      setTimeout(async () => {
        if (!res && (await isPermissionGranted())) {
          sendNotification({ title: "TextSnap", body: "TextSnap is processing..." });
        }
      }, 1500);
    }
  };

  onMount(async () => {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    await TESSERACT_WORKER;
    const overlay = await SnapOverlayApi.get();
    const unlistenShown = await overlay?.listen("snap_overlay:shown", () => {
      SnapOverlayApi.registerHideShortcut();
    });
    const unlistenHidden = await overlay?.listen("snap_overlay:hidden", () => {
      SnapOverlayApi.unregisterHideShortcut();
    });

    return () => {
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

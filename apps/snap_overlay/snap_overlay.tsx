import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";

import { Tools } from "./tools";

const DEFAULT_POS = { x: 0, y: 0 };

function SnapOverlay() {
  Theme.create();
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;
  let unlistenRecognized: UnlistenFn | undefined;

  const [isSelecting, setIsSelecting] = createSignal(false);
  const [startPos, setStartPos] = createSignal(DEFAULT_POS);
  const [currentPos, setCurrentPos] = createSignal(DEFAULT_POS);
  const params = createMemo<RegionCaptureParams>(() => ({
    x: Math.min(startPos().x, currentPos().x),
    y: Math.min(startPos().y, currentPos().y),
    width: Math.abs(currentPos().x - startPos().x),
    height: Math.abs(currentPos().y - startPos().y),
  }));

  const overlaySlices = createMemo(() => {
    const p = params();
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    return {
      // Area above the selection
      top: {
        left: "0px",
        top: "0px",
        right: "0px",
        height: `${y}px`,
      },
      // Area to the left of the selection
      left: {
        left: "0px",
        top: `${y}px`,
        width: `${x}px`,
        height: `${h}px`,
      },
      // Area to the right of the selection
      right: {
        left: `${x + w}px`,
        right: "0px",
        top: `${y}px`,
        height: `${h}px`,
      },
      // Area below the selection
      bottom: {
        left: "0px",
        right: "0px",
        top: `${y + h}px`,
        bottom: "0px",
      },
    };
  });

  const selectionRect = createMemo(() => {
    const p = params();
    return {
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.width}px`,
      height: `${p.height}px`,
    };
  });

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
    if (!isSelecting()) {
      return;
    }
    if (e.button === 0) {
      setIsSelecting(false);
      const p = params();
      setStartPos(DEFAULT_POS);
      setCurrentPos(DEFAULT_POS);

      SnapOverlayApi.close();

      await RegionCaptureApi.recognizeRegionText(p);
    }
  };

  onMount(async () => {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    unlistenShown = await SnapOverlayApi.onShown(async () => {
      await Theme.syncThemeFromStore();
      await SnapOverlayApi.registerHideShortcut();
    });
    unlistenHidden = await SnapOverlayApi.onHidden(async () => {
      await SnapOverlayApi.unregisterHideShortcut();
    });

    unlistenRecognized = await SnapOverlayApi.onRecognized<string>(async (event) => {
      if (event.payload) {
        writeText(event.payload);

        if (await isPermissionGranted()) {
          sendNotification({
            title: "TextSnap",
            body: "Text was copied to the clipboard",
          });
        }
      }
    });
  });

  onCleanup(async () => {
    if (unlistenShown) {
      unlistenShown();
    }

    if (unlistenHidden) {
      unlistenHidden();
    }

    if (unlistenRecognized) {
      unlistenRecognized();
    }

    try {
      await SnapOverlayApi.unregisterHideShortcut();
    } catch (err) {
      console.log(err);
    }
  });

  return (
    <>
      <div class="h-full w-full relative bg-transparent">
        <div
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          class="absolute inset-0 cursor-crosshair"
        >
          {!isSelecting() && <div class="absolute inset-0 bg-black opacity-50" />}

          {isSelecting() && (
            <>
              <div class="absolute bg-black opacity-50" style={overlaySlices().top} />
              <div class="absolute bg-black opacity-50" style={overlaySlices().left} />
              <div class="absolute bg-black opacity-50" style={overlaySlices().right} />
              <div class="absolute bg-black opacity-50" style={overlaySlices().bottom} />
              <div
                class="absolute pointer-events-none border-1 border-white"
                style={selectionRect()}
              />
            </>
          )}
        </div>

        <Tools />
      </div>
    </>
  );
}

export default SnapOverlay;

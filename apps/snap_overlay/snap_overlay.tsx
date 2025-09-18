import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { createMemo, createSignal, onCleanup, onMount } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createSelection } from "@/shared/libs/selection";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";

import { Tools } from "./tools";

function SnapOverlay() {
  Theme.create();
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;

  const [cursorStyle, setCursorStyle] = createSignal("cursor-crosshair");

  const onSelected = async (selection: RegionCaptureParams) => {
    setCursorStyle("cursor-default");
    SnapOverlayApi.close();

    const text = await RegionCaptureApi.recognizeRegionText(selection);

    setCursorStyle("cursor-crosshair");

    if (text) {
      writeText(text);
      if (await isPermissionGranted()) {
        sendNotification({
          title: "TextSnap",
          body: "Text was copied to the clipboard",
        });
      }
    }
  };

  const [selection, isSelecting, onSelectionStart] = createSelection(onSelected);

  const overlaySlices = createMemo(() => {
    const p = selection();
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    return {
      top: {
        left: "0px",
        top: "0px",
        right: "0px",
        height: `${y}px`,
      },
      left: {
        left: "0px",
        top: `${y}px`,
        width: `${x}px`,
        height: `${h}px`,
      },
      right: {
        left: `${x + w}px`,
        right: "0px",
        top: `${y}px`,
        height: `${h}px`,
      },
      bottom: {
        left: "0px",
        right: "0px",
        top: `${y + h}px`,
        bottom: "0px",
      },
    };
  });

  const selectionRect = createMemo(() => {
    const p = selection();
    return {
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.width}px`,
      height: `${p.height}px`,
    };
  });

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
  });

  onCleanup(async () => {
    if (unlistenShown) {
      unlistenShown();
    }

    if (unlistenHidden) {
      unlistenHidden();
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
        <div onMouseDown={onSelectionStart} class={cn("absolute inset-0", cursorStyle())}>
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

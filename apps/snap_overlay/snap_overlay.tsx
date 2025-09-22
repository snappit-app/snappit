import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createSelection } from "@/shared/libs/selection";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";

import { AreaSelection, Tools, ToolValue } from "./tools";
import { createQrScanner, QrScanner } from "./tools/qr-scanner";

function SnapOverlay() {
  Theme.create();
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;

  const [cursorStyle, setCursorStyle] = createSignal("cursor-crosshair");
  const [activeTool, setActiveTool] = createSignal<ToolValue>("smart");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);
  const isQrTool = createMemo(() => activeTool() === "scan");
  const [selection, isSelecting, onSelectionStart] = createSelection(onSelected);
  const showBackdrop = createMemo(() => (!isSelecting() && !isQrTool()) || mouseOnTools());

  const qrScanner = createQrScanner({
    isActive: isQrTool,
    onScanSuccess: async (content) => {
      console.log(content);
      SnapOverlayApi.close();
      await writeText(content);

      if (await isPermissionGranted()) {
        sendNotification({
          title: "TextSnap — QR",
          body: `${content}`,
        });
      }
    },
  });

  const onOverlayMouseDown = (event: MouseEvent) => {
    if (isQrTool()) {
      return;
    }
    onSelectionStart(event);
  };

  async function onSelected(selection: RegionCaptureParams) {
    setCursorStyle("cursor-default");
    SnapOverlayApi.close();

    const text = await RegionCaptureApi.recognizeRegionText(selection);

    setCursorStyle("cursor-crosshair");

    if (text) {
      await writeText(text);
      if (await isPermissionGranted()) {
        sendNotification({
          title: "TextSnap",
          body: "Text was copied to the clipboard",
        });
      }
    }
  }

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
        <div onMouseDown={onOverlayMouseDown} class={cn("absolute inset-0 ", cursorStyle())}>
          <Show when={showBackdrop()}>
            <div class="absolute inset-0 bg-backdrop" />
          </Show>

          <Show when={isSelecting()}>
            <AreaSelection selection={selection} />
          </Show>

          <Show when={isQrTool() && !mouseOnTools() && qrScanner.frame()}>
            {(frame) => <QrScanner frame={frame} />}
          </Show>
        </div>

        <Tools
          onpointerover={() => setMouseOnTools(true)}
          onpointerleave={() => setMouseOnTools(false)}
          value={activeTool()}
          onValueChange={(tool) => setActiveTool(tool)}
        />
      </div>
    </>
  );
}

export default SnapOverlay;

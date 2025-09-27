import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";

import { AreaSelection, createSelection, onAreaSelected } from "@/apps/snap_overlay/area_selection";
import { createQrScanner, onScanSuccess, QrScanner } from "@/apps/snap_overlay/qr-scan";
import { cn } from "@/shared/libs/cn";
import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";
import { Overlay, StaticBackdrop } from "@/shared/ui/overlay/overlay";

import { Tools, ToolValue } from "./tools";

function SnapOverlay() {
  Theme.create();
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;

  const [cursorStyle, setCursorStyle] = createSignal("cursor-crosshair");
  const [overlayVisible, setOverlayVisible] = createSignal(false);
  const [activeTool, setActiveTool] = createSignal<ToolValue>("smart");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);
  const [selection, isSelecting, onSelectionStart] = createSelection(
    async (selection: RegionCaptureParams) => {
      setCursorStyle("cursor-default");
      await onAreaSelected(selection, activeTool() === "smart");
      setCursorStyle("cursor-crosshair");
    },
  );

  const isQrTool = createMemo(() => activeTool() === "scan");
  const isQrActive = createMemo(() => isQrTool() && overlayVisible());
  const showBackdrop = createMemo(() => (!isSelecting() && !isQrTool()) || mouseOnTools());

  const qrScanner = createQrScanner({
    isActive: isQrActive,
    onScanSuccess,
  });

  const onOverlayMouseDown = (event: MouseEvent) => {
    if (activeTool() === "smart" || activeTool() === "copy") {
      onSelectionStart(event);
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
      setOverlayVisible(true);
      await SnapOverlayApi.registerHideShortcut();
    });
    unlistenHidden = await SnapOverlayApi.onHidden(async () => {
      setOverlayVisible(false);
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
    <Overlay>
      <div onMouseDown={onOverlayMouseDown} class={cn("absolute inset-0 ", cursorStyle())}>
        <Show when={showBackdrop()}>
          <StaticBackdrop />
        </Show>

        <Show when={isSelecting()}>
          <AreaSelection pos={selection} />
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
    </Overlay>
  );
}

export default SnapOverlay;

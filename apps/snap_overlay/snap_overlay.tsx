import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";

import { AreaSelection, createSelection, onAreaSelected } from "@/apps/snap_overlay/area_selection";
import { ColorDropper } from "@/apps/snap_overlay/color_dropper";
import { createQrScanner, onScanSuccess, QrScanner } from "@/apps/snap_overlay/qr-scan";
import { Ruler } from "@/apps/snap_overlay/ruler";
import { cn } from "@/shared/libs/cn";
import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";
import { Overlay, StaticBackdrop } from "@/shared/ui/overlay/overlay";

import { Tools, ToolValue } from "./tools";

function SnapOverlay() {
  Theme.create();

  const [cursorStyle, setCursorStyle] = createSignal("cursor-default");
  const [activeTool, setActiveTool] = createSignal<ToolValue>("smart");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);
  const [selection, isSelecting, onSelectionStart] = createSelection(
    async (selection: RegionCaptureParams) => {
      setCursorStyle("cursor-none");
      await onAreaSelected(selection, activeTool() === "smart");
      setCursorStyle("cursor-default");
    },
  );

  const isSmartTool = createMemo(() => activeTool() === "smart");
  const isCopyTool = createMemo(() => activeTool() === "copy");
  const isRulerTool = createMemo(() => activeTool() === "ruler");
  const isQrTool = createMemo(() => activeTool() === "scan");
  const isColorDropperTool = createMemo(() => activeTool() === "dropper");
  const showQrScanner = createMemo(() => isQrTool() && !mouseOnTools() && qrScanner.frame());
  const showColorDropper = createMemo(() => isColorDropperTool() && !mouseOnTools());
  const showRuler = createMemo(() => isRulerTool() && !mouseOnTools());

  const showBackdrop = createMemo(() => {
    if (isColorDropperTool() || isRulerTool()) {
      return false;
    }

    if (isSmartTool() || isCopyTool()) {
      return !isSelecting();
    }

    return mouseOnTools();
  });

  const qrScanner = createQrScanner({
    isActive: isQrTool,
    onScanSuccess,
  });

  const onOverlayMouseDown = (event: MouseEvent) => {
    if (activeTool() === "smart" || activeTool() === "copy") {
      onSelectionStart(event);
    }
  };

  onMount(async () => {
    await Theme.syncThemeFromStore();
    await SnapOverlayApi.registerHideShortcut();
  });

  onCleanup(async () => {
    await SnapOverlayApi.unregisterHideShortcut();
  });

  createEffect(() => {
    if (isCopyTool() || isSmartTool()) {
      setCursorStyle("cursor-crosshair");
    } else {
      setCursorStyle("cursor-default");
    }
  });

  createEffect(() => {
    if (isSelecting()) {
      setMouseOnTools(false);
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

        <Show when={showQrScanner()}>{(frame) => <QrScanner frame={frame} />}</Show>

        <Show when={showColorDropper()}>
          <ColorDropper />
        </Show>

        <Show when={showRuler()}>
          <Ruler />
        </Show>
      </div>

      <Tools
        class={cn(
          "transition-[opacity,transform] duration-200 ease-in-out pointer-events-auto",
          isSelecting() ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100",
        )}
        aria-hidden={isSelecting()}
        onpointerover={() => setMouseOnTools(true)}
        onpointerleave={() => setMouseOnTools(false)}
        value={activeTool()}
        onValueChange={(tool) => setActiveTool(tool)}
      />
    </Overlay>
  );
}

export default SnapOverlay;

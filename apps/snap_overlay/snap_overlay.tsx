import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { AreaSelection, createSelection, onAreaSelected } from "@/apps/snap_overlay/area_selection";
import { ColorDropper } from "@/apps/snap_overlay/color_dropper";
import { createQrScanner, onScanSuccess, QrScanner } from "@/apps/snap_overlay/qr-scan";
import { Ruler } from "@/apps/snap_overlay/ruler";
import { cn } from "@/shared/libs/cn";
import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { TextSnapOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { Theme } from "@/shared/theme";
import { Overlay, StaticBackdrop } from "@/shared/ui/overlay/overlay";

import { Tools } from "./tools";

interface snapOverlayProps {
  target?: Accessor<TextSnapOverlayTarget>;
}

function SnapOverlay(props: snapOverlayProps) {
  const [cursorStyle, setCursorStyle] = createSignal("cursor-default");
  const [activeTool, setActiveTool] = createSignal<TextSnapOverlayTarget>("smart_tool");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);

  const isSmartTool = createMemo(() => activeTool() === "smart_tool");
  const isCopyTool = createMemo(() => activeTool() === "text_capture");
  const isRulerTool = createMemo(() => activeTool() === "digital_ruler");
  const isQrTool = createMemo(() => activeTool() === "qr_scanner");
  const isColorDropperTool = createMemo(() => activeTool() === "color_dropper");
  const showQrScanner = createMemo(() => isQrTool() && !mouseOnTools() && qrScanner.frame());
  const showColorDropper = createMemo(() => isColorDropperTool() && !mouseOnTools());
  const showRuler = createMemo(() => isRulerTool() && !mouseOnTools());

  const [selection, isSelecting, onSelectionStart] = createSelection(
    async (selection: RegionCaptureParams) => {
      setCursorStyle("cursor-none");
      await onAreaSelected(selection, activeTool() === "smart_tool");
      setCursorStyle("cursor-default");
    },
  );

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
    if (activeTool() === "smart_tool" || activeTool() === "text_capture") {
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

  onMount(async () => {
    const overlay = await SnapOverlayApi.get();
    overlay?.onFocusChanged((e) => {
      if (e.event === "tauri://blur") {
        SnapOverlayApi.close();
      }
    });
  });

  createEffect(() => {
    if (props?.target && props.target() !== "none") {
      setActiveTool(props.target());
    }
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

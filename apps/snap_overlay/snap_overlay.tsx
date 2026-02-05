import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
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
import { SNAPPIT_CONSTS } from "@/shared/constants";
import { cn } from "@/shared/libs/cn";
import { SnappitStore } from "@/shared/store";
import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { Overlay, StaticBackdrop } from "@/shared/ui/overlay/overlay";

import { Tools } from "./tools";

interface snapOverlayProps {
  target?: Accessor<SnappitOverlayTarget>;
}

function SnapOverlay(props: snapOverlayProps) {
  let unregisterFocus: UnlistenFn | undefined;
  const [cursorStyle, setCursorStyle] = createSignal("cursor-default");
  const [activeTool, setActiveTool] = createSignal<SnappitOverlayTarget>("capture");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);
  const [toolsEnabled] = SnappitStore.createValue<boolean>(SNAPPIT_CONSTS.store.keys.tools_panel);
  const isCaptureTool = createMemo(() => activeTool() === "capture");
  const isRulerTool = createMemo(() => activeTool() === "digital_ruler");
  const isQrTool = createMemo(() => activeTool() === "qr_scanner");
  const isColorDropperTool = createMemo(() => activeTool() === "color_dropper");

  const showQrScanner = createMemo(() => isQrTool() && !mouseOnTools() && qrScanner.frame());
  const showColorDropper = createMemo(() => isColorDropperTool() && !mouseOnTools());
  const showRuler = createMemo(() => isRulerTool() && !mouseOnTools());

  const [selection, isSelecting, onSelectionStart] = createSelection(
    async (selection: RegionCaptureParams) => {
      setCursorStyle("cursor-none");
      await onAreaSelected(selection);
      setCursorStyle("cursor-default");
    },
  );

  const showBackdrop = createMemo(() => {
    if (isColorDropperTool() || isRulerTool()) {
      return false;
    }

    if (isCaptureTool()) {
      return !isSelecting();
    }

    return mouseOnTools();
  });

  const qrScanner = createQrScanner({
    isActive: isQrTool,
    onScanSuccess,
  });

  const onOverlayMouseDown = (event: MouseEvent) => {
    if (activeTool() === "capture") {
      onSelectionStart(event);
    }
  };

  onMount(async () => {
    await SnappitStore.sync();
  });

  onMount(async () => {
    const overlay = await SnapOverlayApi.get();
    unregisterFocus = await overlay?.onFocusChanged((e) => {
      if (e.event === "tauri://blur") {
        SnapOverlayApi.hide();
      }
    });
  });

  onCleanup(() => {
    if (unregisterFocus) {
      unregisterFocus();
    }
  });

  createEffect(() => {
    if (props?.target && props.target() !== "none") {
      setActiveTool(props.target());
    }
  });

  createEffect(() => {
    if (isCaptureTool()) {
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

      <Show when={toolsEnabled() ?? true}>
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
      </Show>
    </Overlay>
  );
}

export default SnapOverlay;

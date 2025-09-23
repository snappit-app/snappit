import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createSelection } from "@/shared/libs/selection";
import { RegionCaptureApi, RegionCaptureParams } from "@/shared/tauri/region_capture_api";
import { Theme } from "@/shared/theme";

import { AreaSelection, Tools, ToolValue } from "./tools";
import { createQrScanner, QrScanner } from "./tools/qr-scanner";

const normalizeHttpUrl = (raw: string) => {
  const value = raw.trim();
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    if (/^www\./i.test(value)) {
      return `https://${value}`;
    }
    return undefined;
  }
};

const notifyQr = async (body: string) => {
  if (await isPermissionGranted()) {
    sendNotification({
      title: "TextSnap — QR",
      body,
    });
  }
};

function SnapOverlay() {
  Theme.create();
  let unlistenShown: UnlistenFn | undefined;
  let unlistenHidden: UnlistenFn | undefined;

  const [cursorStyle, setCursorStyle] = createSignal("cursor-crosshair");
  const [overlayVisible, setOverlayVisible] = createSignal(false);
  const [activeTool, setActiveTool] = createSignal<ToolValue>("smart");
  const [mouseOnTools, setMouseOnTools] = createSignal<boolean>(false);
  const [selection, isSelecting, onSelectionStart] = createSelection(onSelected);

  const isQrTool = createMemo(() => activeTool() === "scan");
  const isQrActive = createMemo(() => isQrTool() && overlayVisible());
  const showBackdrop = createMemo(() => (!isSelecting() && !isQrTool()) || mouseOnTools());

  const qrScanner = createQrScanner({
    isActive: isQrActive,
    onScanSuccess: async (content) => {
      console.log(content);
      const normalizedUrl = normalizeHttpUrl(content);

      if (normalizedUrl) {
        try {
          await openUrl(normalizedUrl);
          await notifyQr(`Opened: ${normalizedUrl}`);
        } catch (err) {
          console.error("Failed to open QR URL", err);
          await writeText(content);
          await notifyQr(`Copied: ${content}`);
        }
      } else {
        await writeText(content);
        await notifyQr(`Copied: ${content}`);
      }

      SnapOverlayApi.close();
    },
  });

  const onOverlayMouseDown = (event: MouseEvent) => {
    if (activeTool() === "smart" || activeTool() === "copy") {
      onSelectionStart(event);
    }
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
    <>
      <div class="h-full w-full relative bg-transparent overflow-hidden scroll-none">
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

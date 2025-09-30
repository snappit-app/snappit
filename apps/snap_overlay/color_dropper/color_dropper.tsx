import { ColorDropperApi, ColorInfo } from "@shared/tauri/color_dropper_api";
import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createSignal, onCleanup, Show } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { RegionCaptureApi } from "@/shared/tauri/region_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

const ratio = TEXT_SNAP_CONSTS.store.color_dropper.magnify_ratio;
const size = TEXT_SNAP_CONSTS.store.color_dropper.magnify_radius * 2 + 1;
const magnifyDim = ratio * size;

export function ColorDropper() {
  const [colorInfo, setColorInfo] = createSignal<ColorInfo | null>(null);
  const [magnifiedImage, setMagnifiedImage] = createSignal<string | null>(null);

  const animationFrameId: number | null = null;

  const setImageData = async () => {
    const blob = await RegionCaptureApi.getLastShotData();

    const url = URL.createObjectURL(blob);
    setMagnifiedImage(url);
  };

  const captureColorAndMagnifiedView = throttle(async (x: number, y: number) => {
    const [color] = await Promise.all([
      ColorDropperApi.captureColorAtCursor(x, y),
      ColorDropperApi.captureMagnifiedView(x, y),
    ]);

    setColorInfo(color);
    setImageData();
  }, 32);

  const handleMouseMove = (event: MouseEvent) => {
    captureColorAndMagnifiedView(event.clientX, event.clientY);
  };

  const handleMouseClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (colorInfo()) {
      await ColorDropperApi.copyColorToClipboard(colorInfo()!);
      await SnapOverlayApi.close();
    }
  };

  createEventListener(window, "mousemove", handleMouseMove);
  createEventListener(window, "click", handleMouseClick);

  onCleanup(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    if (magnifiedImage()) {
      URL.revokeObjectURL(magnifiedImage()!);
    }
  });

  return (
    <div class="absolute bottom-4 right-4 z-50 transition-[opacity] duration-200 ease-in-out hover:opacity-35">
      <div class="bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border pointer-events-none ">
        <div class="mb-2 relative">
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-black outline outline-2 outline-white"
            style={{
              width: `${ratio}px`,
              height: `${ratio}px`,
            }}
          />
          <Show when={magnifiedImage()}>
            {(src) => (
              <img
                src={src()}
                alt="Magnified view"
                class="border border-border rounded"
                style={{
                  width: `${magnifyDim}px`,
                  height: `${magnifyDim}px`,
                  "image-rendering": "pixelated",
                }}
              />
            )}
          </Show>
        </div>

        <Show when={colorInfo()}>
          {(info) => (
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <div
                  class="w-4 h-4 rounded border border-border"
                  style={{
                    "background-color": info().hex,
                  }}
                />
                <span class="text-sm font-mono text-foreground">{info().hex}</span>
              </div>
              <div class="text-xs text-muted-foreground">RGB: {info().rgb.join(", ")}</div>
              <div class="text-xs text-muted-foreground">Click to copy</div>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}

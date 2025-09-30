import { ColorDropperApi, ColorInfo } from "@shared/tauri/color_dropper_api";
import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createSignal, onCleanup, Show } from "solid-js";

import { RegionCaptureApi } from "@/shared/tauri/region_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

interface ColorDropperProps {
  isActive: boolean;
  onColorPicked?: (color: ColorInfo) => void;
}

export function ColorDropper(props: ColorDropperProps) {
  const [colorInfo, setColorInfo] = createSignal<ColorInfo | null>(null);
  const [magnifiedImage, setMagnifiedImage] = createSignal<string | null>(null);

  const animationFrameId: number | null = null;

  const MAGNIFY_RATIO = 15;
  const MAGNIFIED_GRID_SIZE = 13;
  const MAGNIFIED_DIMENSION = MAGNIFY_RATIO * MAGNIFIED_GRID_SIZE;

  const setImageData = async () => {
    const blob = await RegionCaptureApi.getLastShotData();

    const url = URL.createObjectURL(blob);
    setMagnifiedImage(url);
  };

  const captureColorAndMagnifiedView = throttle(async (x: number, y: number) => {
    if (!props.isActive) {
      return;
    }

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

    if (colorInfo() && props.isActive) {
      await ColorDropperApi.copyColorToClipboard(colorInfo()!);
      await SnapOverlayApi.close();
      if (props.onColorPicked) {
        props.onColorPicked(colorInfo()!);
      }
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
    <Show when={props.isActive && colorInfo()}>
      <div class="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div class="bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
          <div class="mb-2 relative">
            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-black outline outline-2 outline-white"
              data-cursor
              style={{
                width: `${MAGNIFY_RATIO}px`,
                height: `${MAGNIFY_RATIO}px`,
              }}
            />
            <Show when={magnifiedImage()}>
              {(src) => (
                <img
                  src={src()}
                  alt="Magnified view"
                  class="border border-border rounded"
                  style={{
                    width: `${MAGNIFIED_DIMENSION}px`,
                    height: `${MAGNIFIED_DIMENSION}px`,
                    "image-rendering": "pixelated",
                  }}
                />
              )}
            </Show>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <div
                class="w-4 h-4 rounded border border-border"
                style={{
                  "background-color": colorInfo()?.hex,
                }}
              />
              <span class="text-sm font-mono text-foreground">{colorInfo()?.hex}</span>
            </div>
            <div class="text-xs text-muted-foreground">RGB: {colorInfo()?.rgb.join(", ")}</div>
            <div class="text-xs text-muted-foreground">Click to copy</div>
          </div>
        </div>
      </div>
    </Show>
  );
}

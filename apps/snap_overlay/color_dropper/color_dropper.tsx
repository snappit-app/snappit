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
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] border-1 border-white" />
            <Show when={magnifiedImage()}>
              {(src) => (
                <img
                  src={src()}
                  alt="Magnified view"
                  class="w-[120px] h-[120px] border border-border rounded"
                  style={{
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

import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createSignal, Show } from "solid-js";

import { onColorRecognized } from "@/apps/snap_overlay/color_dropper/on_recognized";
import { createScreenMagnifier, ScreenMagnifier } from "@/apps/snap_overlay/screen_magnifier";
import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { ColorDropperApi, ColorInfo } from "@/shared/tauri/screen_capture_api";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";

const ratio = TEXT_SNAP_CONSTS.store.color_dropper.magnify_ratio;

export function ColorDropper() {
  const magnifierSrc = createScreenMagnifier();
  const [colorInfo, setColorInfo] = createSignal<ColorInfo | null>(null);

  const captureColorAndMagnifiedView = throttle(async (x: number, y: number) => {
    const color = await ColorDropperApi.captureColorAtCursor(x, y);

    setColorInfo(color);
  }, 32);

  const handleMouseClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (colorInfo()) {
      onColorRecognized(colorInfo()!);
      await SnapOverlayApi.close();
    }
  };

  createEventListener(window, "mousemove", (e: MouseEvent) =>
    captureColorAndMagnifiedView(e.clientX, e.clientY),
  );
  createEventListener(window, "click", handleMouseClick);

  return (
    <Show when={magnifierSrc()}>
      {(src) => (
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
              <ScreenMagnifier src={src} />
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
      )}
    </Show>
  );
}

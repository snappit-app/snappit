import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { createSignal, onCleanup, Show } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { RegionCaptureApi } from "@/shared/tauri/region_capture_api";
import { ColorDropperApi } from "@/shared/tauri/screen_capture_api";

const ratio = TEXT_SNAP_CONSTS.store.color_dropper.magnify_ratio;
const size = TEXT_SNAP_CONSTS.store.color_dropper.magnify_radius * 2 + 1;
const magnifyDim = ratio * size;

export function ScreenMagnifier() {
  const [magnifiedImage, setMagnifiedImage] = createSignal<string | null>(null);

  const setImageData = async () => {
    const blob = await RegionCaptureApi.getLastShotData();

    const url = URL.createObjectURL(blob);
    setMagnifiedImage(url);
  };

  const captureColorAndMagnifiedView = throttle(async (x: number, y: number) => {
    await ColorDropperApi.captureMagnifiedView(x, y);

    setImageData();
  }, 32);

  createEventListener(window, "mousemove", (e: MouseEvent) =>
    captureColorAndMagnifiedView(e.x, e.y),
  );

  onCleanup(() => {
    if (magnifiedImage()) {
      URL.revokeObjectURL(magnifiedImage()!);
    }
  });

  return (
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
  );
}

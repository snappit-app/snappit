import { createEventListener } from "@solid-primitives/event-listener";
import { throttle } from "@solid-primitives/scheduled";
import { Accessor, createSignal, onCleanup } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { RegionCaptureApi } from "@/shared/tauri/region_capture_api";
import { ColorDropperApi } from "@/shared/tauri/screen_capture_api";

const ratio = SNAPPIT_CONSTS.store.color_dropper.magnify_ratio;
const size = SNAPPIT_CONSTS.store.color_dropper.magnify_radius * 2 + 1;
const magnifyDim = ratio * size;

interface screenMagnifierProps {
  src: Accessor<string>;
}

export function createScreenMagnifier() {
  const [magnifiedImage, setMagnifiedImage] = createSignal<string | null>(null);

  const setImageData = async () => {
    const blob = await RegionCaptureApi.getLastShotData();

    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(magnifiedImage()!);
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

  return magnifiedImage;
}

export function ScreenMagnifier(props: screenMagnifierProps) {
  return (
    <img
      src={props.src()}
      alt="Magnified view"
      class="border border-border rounded"
      style={{
        width: `${magnifyDim}px`,
        height: `${magnifyDim}px`,
        "image-rendering": "pixelated",
      }}
    />
  );
}

import { invoke } from "@tauri-apps/api/core";

export interface RegionCaptureParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function captureRegion(params: RegionCaptureParams) {
  return invoke("region_capture", { params });
}

export function getLastShotDim() {
  return invoke<[number, number]>("get_last_shot_dim");
}

export async function getLastShotData(): Promise<OffscreenCanvas | HTMLCanvasElement> {
  const res = await fetch("img://current", {
    method: "GET",
  });

  const buf = await res.arrayBuffer();
  const [width, height] = await getLastShotDim();
  const u8 = new Uint8ClampedArray(buf);

  if (u8.byteLength !== width * height * 4) {
    throw new Error("Bad frame size");
  }

  const imgData = new ImageData(u8, width, height);

  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(width, height)
      : (() => {
          const c = document.createElement("canvas");
          c.width = width;
          c.height = height;
          return c;
        })();

  const ctx = canvas.getContext("2d", { willReadFrequently: false })!;
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

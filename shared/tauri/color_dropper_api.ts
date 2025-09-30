import { invoke } from "@tauri-apps/api/core";

export interface ColorInfo {
  hex: string;
  rgb: [number, number, number];
  rgba: [number, number, number, number];
}

export class ColorDropperApi {
  static async captureColorAtCursor(x: number, y: number): Promise<ColorInfo> {
    return await invoke<ColorInfo>("capture_color_at_cursor", { x, y });
  }

  static async captureMagnifiedView(x: number, y: number): Promise<void> {
    await invoke<number[]>("capture_magnified_view", {
      x,
      y,
    });
  }

  static async copyColorToClipboard(color: ColorInfo): Promise<void> {
    await navigator.clipboard.writeText(color.hex);
  }
}

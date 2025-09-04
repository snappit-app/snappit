import { invoke } from "@tauri-apps/api/core";

export abstract class TextSnapTrayApi {
  static async updateCaptureShortcut() {
    return invoke("update_tray_shortcut");
  }
}

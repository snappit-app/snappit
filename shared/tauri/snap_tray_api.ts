import { invoke } from "@tauri-apps/api/core";

export abstract class TextSnapTrayApi {
  static async updateShortcuts() {
    return invoke("update_tray_shortcuts");
  }
}

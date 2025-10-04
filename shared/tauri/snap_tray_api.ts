import { invoke } from "@tauri-apps/api/core";

import { TextSnapOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export abstract class TextSnapTrayApi {
  static async updateShortcut(target: TextSnapOverlayTarget) {
    return invoke("update_tray_shortcut", { target });
  }

  static async updateShortcuts() {
    return invoke("update_tray_shortcuts");
  }
}

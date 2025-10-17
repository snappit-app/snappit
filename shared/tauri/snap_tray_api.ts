import { invoke } from "@tauri-apps/api/core";

import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export abstract class SnappitTrayApi {
  static async updateShortcut(target: SnappitOverlayTarget) {
    return invoke("update_tray_shortcut", { target });
  }

  static async updateShortcuts() {
    return invoke("update_tray_shortcuts");
  }
}

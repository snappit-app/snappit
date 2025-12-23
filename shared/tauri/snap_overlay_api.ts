import { invoke } from "@tauri-apps/api/core";
import { EventCallback } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

export abstract class SnapOverlayApi {
  static async get() {
    return WebviewWindow.getByLabel(SNAPPIT_CONSTS.windows.overlay);
  }

  static async hide() {
    return invoke("hide_snap_overlay");
  }

  static async show(target: SnappitOverlayTarget) {
    return invoke("show_snap_overlay", { target });
  }

  static async onShown(handler: EventCallback<SnappitOverlayTarget>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:shown", handler);
  }

  static async onHidden(handler: EventCallback<boolean>) {
    const overlay = await this.get();
    return overlay?.listen("snap_overlay:hidden", handler);
  }

  static async getCurrentTarget(): Promise<SnappitOverlayTarget | null> {
    return invoke<SnappitOverlayTarget | null>("get_snap_overlay_target");
  }
}

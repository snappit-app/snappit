import { invoke } from "@tauri-apps/api/core";

export function showSnapOverlay() {
  return invoke("show_snap_overlay");
}

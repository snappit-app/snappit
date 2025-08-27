import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";

const HIDE_SNAP_OVERLAY_SHORTCUT = "Escape";
const SHOW_SNAP_OVERLAY_SHORTCUT = "CommandOrControl+Shift+2";

export async function closeSnapOverlay() {
  const overlay = await WebviewWindow.getByLabel("snap_overlay");
  overlay?.hide();
  await unregister(HIDE_SNAP_OVERLAY_SHORTCUT);
}

export async function showSnapOverlay() {
  await register(HIDE_SNAP_OVERLAY_SHORTCUT, (e) => {
    if (e.state === "Released") {
      closeSnapOverlay();
    }
  });
  return invoke("show_snap_overlay");
}

export async function registerShowSnapShortcut() {
  await register(SHOW_SNAP_OVERLAY_SHORTCUT, (e) => {
    if (e.state === "Pressed") {
      showSnapOverlay();
    }
  });
}

export async function unregisterShowSnapShortcut() {
  await unregister(SHOW_SNAP_OVERLAY_SHORTCUT);
}

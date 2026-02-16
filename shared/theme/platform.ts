import { platform } from "@tauri-apps/plugin-os";

const PLATFORM_ATTR = "data-platform";

let initialized = false;

export function applyPlatformStyles() {
  if (initialized || typeof document === "undefined") return;
  initialized = true;

  document.documentElement.setAttribute(PLATFORM_ATTR, platform());
  document.body?.setAttribute(PLATFORM_ATTR, platform());
}

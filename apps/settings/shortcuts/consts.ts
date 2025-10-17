import { SNAPPIT_CONSTS } from "@/shared/constants";

export const DEFAULT_SHORTCUTS = SNAPPIT_CONSTS.defaults.shortcuts;
export type ShortcutKeys = keyof typeof DEFAULT_SHORTCUTS;

export const SMART_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys.hotkey_capture as ShortcutKeys;
export const TEXT_CAPTURE_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys
  .hotkey_text_capture as ShortcutKeys;
export const DIGITAL_RULER_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys
  .hotkey_digital_ruler as ShortcutKeys;
export const COLOR_DROPPER_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys
  .hotkey_color_dropper as ShortcutKeys;
export const QR_SHORTCUT_KEY = SNAPPIT_CONSTS.store.keys.hotkey_qr_scanner as ShortcutKeys;

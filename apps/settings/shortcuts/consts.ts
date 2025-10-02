import { TEXT_SNAP_CONSTS } from "@/shared/constants";

export const SMART_SHORTCUT_KEY = TEXT_SNAP_CONSTS.store.keys.hotkey_capture;
export const TEXT_CAPTURE_SHORTCUT_KEY = TEXT_SNAP_CONSTS.store.keys.hotkey_text_capture;
export const DIGITAL_RULER_SHORTCUT_KEY = TEXT_SNAP_CONSTS.store.keys.hotkey_digital_ruler;
export const COLOR_DROPPER_SHORTCUT_KEY = TEXT_SNAP_CONSTS.store.keys.hotkey_color_dropper;
export const QR_SHORTCUT_KEY = TEXT_SNAP_CONSTS.store.keys.hotkey_qr_scanner;

export const DEFAULT_SHORTCUTS = {
  [SMART_SHORTCUT_KEY]: "CommandOrControl+Shift+2",
  [TEXT_CAPTURE_SHORTCUT_KEY]: "CommandOrControl+Shift+7",
  [DIGITAL_RULER_SHORTCUT_KEY]: "CommandOrControl+Shift+8",
  [COLOR_DROPPER_SHORTCUT_KEY]: "CommandOrControl+Shift+9",
  [QR_SHORTCUT_KEY]: "CommandOrControl+Shift+0",
};

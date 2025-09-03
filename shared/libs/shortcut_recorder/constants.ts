import { ShortcutRecorderErrorCode } from "./types";

export const ERROR_MESSAGES: Record<ShortcutRecorderErrorCode, string> = {
  [ShortcutRecorderErrorCode.NONE]: "",
  [ShortcutRecorderErrorCode.MAX_MOD_KEYS_EXCEEDED]: "Maximum {maxModKeys} modifier key(s) allowed",
  [ShortcutRecorderErrorCode.MOD_KEY_NOT_ALLOWED]: 'Modifier Key "{modKey}" is not allowed',
  [ShortcutRecorderErrorCode.KEY_NOT_ALLOWED]: 'Key "{keycode}" is not allowed',
  [ShortcutRecorderErrorCode.MIN_MOD_KEYS_REQUIRED]:
    "Minimum {minModKeys} modifier key(s) required",
  [ShortcutRecorderErrorCode.SHORTCUT_NOT_ALLOWED]: 'Key combination "{shortcut}" not allowed',
};

// Used for treating both right and left modifier keys the same
export const MOD_KEYS_MAP = {
  ControlLeft: "Control",
  ControlRight: "Control",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  AltLeft: "Alt",
  AltRight: "Alt",
  MetaLeft: "Meta",
  MetaRight: "Meta",
  OSLeft: "Meta",
  OSRight: "Meta",
  Control: "Control",
  Meta: "Meta",
  Shift: "Shift",
  Alt: "Alt",
} as const;

export function isModKey(key: string): key is keyof typeof MOD_KEYS_MAP {
  return key in MOD_KEYS_MAP;
}

// defines in the order in which mod keys are displayed
export const MOD_KEYS_ORDER: string[] = ["Meta", "Control", "Shift", "Alt"];

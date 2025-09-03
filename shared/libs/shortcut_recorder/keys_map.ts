// Keyboard display mapping for all keys (code -> label/icon) with Platform profiles.
// Works with KeyboardEvent.code (recommended). Fallbacks for odd codes included.

import { Platform, platform } from "@tauri-apps/plugin-os";

type SupportedPlatforms = Extract<Platform, "macos" | "windows" | "linux">;

// mac uses glyphs; win/linux use text (you can tweak to your taste)
const MOD_PROFILE = {
  macos: {
    Meta: "⌘",
    Control: "⌃",
    Alt: "⌥",
    Shift: "⇧",
    Super: "⌘", // alias if you use "Super"
  },
  windows: {
    Meta: "Win",
    Control: "Ctrl",
    Alt: "Alt",
    Shift: "Shift",
    Super: "Win",
  },
  linux: {
    Meta: "Super",
    Control: "Ctrl",
    Alt: "Alt",
    Shift: "Shift",
    Super: "Super",
  },
} as const satisfies Record<SupportedPlatforms, Record<string, string>>;

// ---- Core explicit map for special keys (platform-neutral base) -------------
const BASE_SPECIAL: Record<string, string> = {
  // Editing
  Backspace: "Backspace",
  Tab: "Tab",
  Enter: "Enter",
  NumpadEnter: "Enter",
  Escape: "Esc",
  Delete: "Del",
  Insert: "Ins",

  // Navigation / movement
  Space: "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",

  // Lock keys
  CapsLock: "Caps Lock",
  NumLock: "Num Lock",
  ScrollLock: "Scroll Lock",

  // Context/system
  ContextMenu: "Menu",
  PrintScreen: "PrtScr",
  Pause: "Pause",

  // Intl & language
  IntlBackslash: "\\",
  IntlRo: "Ro",
  IntlYen: "¥",
  Lang1: "Lang1",
  Lang2: "Lang2",
  Lang3: "Lang3",
  Lang4: "Lang4",
  Lang5: "Lang5",
  Convert: "Convert",
  NonConvert: "NonConvert",
  KanaMode: "Kana",
  HangulMode: "Hangul",
  Hanja: "Hanja",

  // Media / browser (you can hide these if your app не использует их)
  MediaTrackNext: "Next Track",
  MediaTrackPrevious: "Prev Track",
  MediaPlayPause: "Play/Pause",
  MediaStop: "Stop",
  AudioVolumeUp: "Vol +",
  AudioVolumeDown: "Vol -",
  AudioVolumeMute: "Mute",
  BrowserBack: "Back",
  BrowserForward: "Forward",
  BrowserRefresh: "Refresh",
  BrowserStop: "Stop",
  BrowserSearch: "Search",
  BrowserFavorites: "Favorites",
  BrowserHome: "Home",

  // OEM / misc (varies by layouts; safe textual defaults)
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Comma: ",",
  Period: ".",
  Slash: "/",

  // Numpad ops
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadDecimal: ".",
  NumpadEqual: "=",
  NumpadComma: ",",

  // Function keys (explicit fallback, though we generate them too)
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
};

// ---- Helpers to derive labels for patterned codes ---------------------------
const LETTER_FROM_CODE = (code: string): string | null => {
  const m = /^Key([A-Z])$/.exec(code);
  return m ? m[1] : null;
};
const DIGIT_FROM_CODE = (code: string): string | null => {
  const m = /^Digit([0-9])$/.exec(code);
  return m ? m[1] : null;
};
const NUMPAD_DIGIT_FROM_CODE = (code: string): string | null => {
  const m = /^Numpad([0-9])$/.exec(code);
  return m ? m[1] : null;
};
const FUNCTION_FROM_CODE = (code: string): string | null => {
  const m = /^F([1-9]|1[0-9]|2[0-4])$/.exec(code); // F1..F24
  return m ? `F${m[1]}` : null;
};
const ARROW_FROM_KEY = (key: string): string | null => {
  switch (key) {
    case "ArrowUp":
      return "↑";
    case "ArrowDown":
      return "↓";
    case "ArrowLeft":
      return "←";
    case "ArrowRight":
      return "→";
    default:
      return null;
  }
};

// ---- Modifiers handling (both left/right collapse to one label) -------------
const MOD_FROM_CODE = (code: string): "Meta" | "Control" | "Alt" | "Shift" | null => {
  if (/^Meta(?:Left|Right)?$/.test(code)) return "Meta";
  if (/^Control(?:Left|Right)?$/.test(code)) return "Control";
  if (/^Alt(?:Left|Right)?$/.test(code)) return "Alt";
  if (/^Shift(?:Left|Right)?$/.test(code)) return "Shift";
  return null;
};

// ---- Public API --------------------------------------------------------------
export interface DisplayOptions {
  Platform?: SupportedPlatforms; // force Platform; default auto-detect
  preferTextOnMac?: boolean; // if true, mac will use text ("Cmd", "Opt", …) not glyphs
  showPlusBetween?: boolean; // used by formatCombo
}

const MAC_TEXT_MODS = { Meta: "Cmd", Alt: "Opt", Shift: "Shift", Control: "Ctrl", Super: "Cmd" };

/** Get display label/icon for a single code (using optional `KeyboardEvent.key` as hint) */
export function displayKey(code: string, keyHint?: string, opts: DisplayOptions = {}): string {
  const os = (opts.Platform ?? platform()) as SupportedPlatforms;

  console.log(os);

  // 1) Modifiers
  const mod = MOD_FROM_CODE(code);
  if (mod) {
    if (os === "macos" && !opts.preferTextOnMac) return MOD_PROFILE.macos[mod];
    if (os === "macos" && opts.preferTextOnMac)
      return MAC_TEXT_MODS[mod as keyof typeof MAC_TEXT_MODS];
    return MOD_PROFILE[os][mod];
  }

  // 2) Base explicit map
  if (code in BASE_SPECIAL) return BASE_SPECIAL[code];

  // 3) Pattern-derived
  const letter = LETTER_FROM_CODE(code);
  if (letter) return letter;

  const digit = DIGIT_FROM_CODE(code);
  if (digit) return digit;

  const numpad = NUMPAD_DIGIT_FROM_CODE(code);
  if (numpad) return numpad;

  const fn = FUNCTION_FROM_CODE(code);
  if (fn) return fn;

  // 4) Arrow by key hint (some layouts use same code but different key)
  if (keyHint) {
    const arrow = ARROW_FROM_KEY(keyHint);
    if (arrow) return arrow;
  }

  // 5) Unknown/locale-specific → graceful fallback
  // Try to prettify some common prefixes:
  if (code.startsWith("Numpad")) return code.replace("Numpad", "Num ");
  if (code.startsWith("Intl")) return code.replace("Intl", "Intl ");
  if (code.startsWith("Bracket")) return code.replace("Bracket", "Bracket ");
  if (code.startsWith("Key")) return code.replace("Key", "");
  if (code.startsWith("Digit")) return code.replace("Digit", "");

  return code; // last resort
}

/** Format a combo of codes (e.g., ["MetaLeft","ShiftLeft","KeyK"]) to a nice string */
export function formatCombo(
  codes: string[],
  keyHints?: (string | undefined)[],
  opts: DisplayOptions = {},
): string {
  // Keep modifiers first in a stable order, then non-mod keys
  const order = ["Control", "Meta", "Alt", "Shift"];
  const parsed = codes.map((c, i) => ({ code: c, keyHint: keyHints?.[i] }));
  const mods = parsed.filter((p) => MOD_FROM_CODE(p.code));
  const others = parsed.filter((p) => !MOD_FROM_CODE(p.code));

  const sortMod = (a: (typeof parsed)[0], b: (typeof parsed)[0]) => {
    const ma = MOD_FROM_CODE(a.code)!;
    const mb = MOD_FROM_CODE(b.code)!;
    return order.indexOf(ma) - order.indexOf(mb);
  };

  const display = (p: (typeof parsed)[0]) => displayKey(p.code, p.keyHint, opts);
  const joiner = (opts.showPlusBetween ?? (opts.Platform ?? platform()) !== "macos") ? " + " : "";

  return [...mods.sort(sortMod).map(display), ...others.map(display)].join(joiner);
}

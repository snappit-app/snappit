import { createEffect, createSignal } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

export const DEFAULT_VALUE = "auto" as const;

// Full language list pulled from https://github.com/tesseract-ocr/tessdata
const TESSERACT_LANGUAGE_CODES = [
  "afr",
  "amh",
  "ara",
  "asm",
  "aze",
  "aze_cyrl",
  "bel",
  "ben",
  "bod",
  "bos",
  "bre",
  "bul",
  "cat",
  "ceb",
  "ces",
  "chi_sim",
  "chi_sim_vert",
  "chi_tra",
  "chi_tra_vert",
  "chr",
  "cos",
  "cym",
  "dan",
  "dan_frak",
  "deu",
  "deu_frak",
  "deu_latf",
  "div",
  "dzo",
  "ell",
  "eng",
  "enm",
  "epo",
  "equ",
  "est",
  "eus",
  "fao",
  "fas",
  "fil",
  "fin",
  "fra",
  "frm",
  "fry",
  "gla",
  "gle",
  "glg",
  "grc",
  "guj",
  "hat",
  "heb",
  "hin",
  "hrv",
  "hun",
  "hye",
  "iku",
  "ind",
  "isl",
  "ita",
  "ita_old",
  "jav",
  "jpn",
  "jpn_vert",
  "kan",
  "kat",
  "kat_old",
  "kaz",
  "khm",
  "kir",
  "kmr",
  "kor",
  "kor_vert",
  "lao",
  "lat",
  "lav",
  "lit",
  "ltz",
  "mal",
  "mar",
  "mkd",
  "mlt",
  "mon",
  "mri",
  "msa",
  "mya",
  "nep",
  "nld",
  "nor",
  "oci",
  "ori",
  "osd",
  "pan",
  "pol",
  "por",
  "pus",
  "que",
  "ron",
  "rus",
  "san",
  "sin",
  "slk",
  "slk_frak",
  "slv",
  "snd",
  "spa",
  "spa_old",
  "sqi",
  "srp",
  "srp_latn",
  "sun",
  "swa",
  "swe",
  "syr",
  "tam",
  "tat",
  "tel",
  "tgk",
  "tgl",
  "tha",
  "tir",
  "ton",
  "tur",
  "uig",
  "ukr",
  "urd",
  "uzb",
  "uzb_cyrl",
  "vie",
  "yid",
  "yor",
] as const;

type TessLanguageCode = (typeof TESSERACT_LANGUAGE_CODES)[number];
export type Language = typeof DEFAULT_VALUE | TessLanguageCode;
export type RecognitionLanguageOption = {
  label: string;
  value: Language;
};

const LANGUAGE_LABEL_OVERRIDES: Partial<Record<TessLanguageCode, string>> = {
  chi_sim: "Chinese (Simplified)",
  chi_tra: "Chinese (Traditional)",
  chi_sim_vert: "Chinese (Simplified, Vertical)",
  chi_tra_vert: "Chinese (Traditional, Vertical)",
  equ: "Math / Equations",
  ita_old: "Old Italian",
  jpn_vert: "Japanese (Vertical)",
  kat_old: "Old Georgian",
  kmr: "Kurdish (Kurmanji)",
  kor_vert: "Korean (Vertical)",
  mri: "Maori",
  osd: "Orientation & Script Detection",
  spa_old: "Old Spanish",
  tgl: "Tagalog",
};

const LANGUAGE_SUFFIX_LABELS = {
  cyrl: "Cyrillic",
  frak: "Fraktur",
  latf: "Latin",
  latn: "Latin",
  old: "Old",
  vert: "Vertical",
} as const;

const LANGUAGE_DISPLAY_NAMES =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

const formatBaseLanguageName = (code: string) => {
  if (LANGUAGE_DISPLAY_NAMES) {
    try {
      const resolved = LANGUAGE_DISPLAY_NAMES.of(code);
      if (resolved) return resolved;
    } catch {
      // Ignore and fall back to the code
    }
  }

  return code.toUpperCase();
};

const buildLanguageLabel = (code: TessLanguageCode): string => {
  const override = LANGUAGE_LABEL_OVERRIDES[code];
  if (override) return override;

  const [base, ...rest] = code.split("_");
  const baseLabel = formatBaseLanguageName(base);

  if (rest.length === 0) {
    return baseLabel;
  }

  const suffix = rest.join("_");
  if (suffix === "old") {
    return `Old ${baseLabel}`;
  }

  const suffixLabel = LANGUAGE_SUFFIX_LABELS[suffix as keyof typeof LANGUAGE_SUFFIX_LABELS];
  if (suffixLabel) {
    return `${baseLabel} (${suffixLabel})`;
  }

  return `${baseLabel} (${suffix.replace(/_/g, " ")})`;
};

const MANUAL_RECOGNITION_LANGUAGE_OPTIONS = TESSERACT_LANGUAGE_CODES.map((value) => ({
  label: buildLanguageLabel(value),
  value,
})).sort((a, b) => a.label.localeCompare(b.label)) satisfies RecognitionLanguageOption[];

export const RECOGNITION_LANGUAGE_OPTIONS = [
  { label: "Auto", value: DEFAULT_VALUE },
  ...MANUAL_RECOGNITION_LANGUAGE_OPTIONS,
] as const satisfies readonly RecognitionLanguageOption[];

type RecognitionLanguagePreference = readonly [() => Language, (next: Language) => void];

const STORE_KEY = SNAPPIT_CONSTS.store.keys.recognition_lang;
const VALID_CODES = new Set<Language>(
  MANUAL_RECOGNITION_LANGUAGE_OPTIONS.map((option) => option.value),
);

const ORDERED_CODES = RECOGNITION_LANGUAGE_OPTIONS.map((option) => option.value);

const sanitizeRecognitionLanguage = (stored: unknown): Language => {
  if (typeof stored !== "string") {
    return DEFAULT_VALUE;
  }

  const trimmed = stored.trim() as Language;
  if (!trimmed || trimmed.toLowerCase() === DEFAULT_VALUE) {
    return DEFAULT_VALUE;
  }

  const requested = new Set(
    trimmed
      .split("+")
      .map((code) => code.trim() as Language)
      .filter((code) => code && VALID_CODES.has(code)),
  );

  if (requested.size === 0) {
    return DEFAULT_VALUE;
  }

  const ordered = ORDERED_CODES.filter((code) => code !== DEFAULT_VALUE && requested.has(code));

  if (ordered.length === 0) {
    return DEFAULT_VALUE;
  }

  return ordered.join("+") as Language;
};

export abstract class RecognitionLanguage {
  private static _singleton: RecognitionLanguagePreference | null = null;

  static create(): RecognitionLanguagePreference {
    if (this._singleton) return this._singleton;

    const [storeValue, setStoreValue] = SnappitStore.createValue<Language>(STORE_KEY);
    const [preference, setPreference] = createSignal<Language>(DEFAULT_VALUE);

    createEffect(() => {
      const stored = storeValue();
      if (stored === undefined) return;

      const sanitized = sanitizeRecognitionLanguage(stored);
      setPreference(sanitized);

      if (stored !== sanitized) {
        setStoreValue(sanitized).catch(() => {});
      }
    });

    function update(next: Language) {
      const sanitized = sanitizeRecognitionLanguage(next);
      setPreference(sanitized);
      setStoreValue(sanitized).catch(() => {});
    }

    this._singleton = [preference, update] as const;
    return this._singleton;
  }
}

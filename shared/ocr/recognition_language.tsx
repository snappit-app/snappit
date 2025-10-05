import { createEffect, createSignal } from "solid-js";

import { TEXT_SNAP_CONSTS } from "@/shared/constants";
import { TextSnapStore } from "@/shared/store";

export const RECOGNITION_LANGUAGE_OPTIONS = [
  { label: "Auto", value: "auto" },
  { label: "English", value: "eng" },
  { label: "Russian", value: "rus" },
  { label: "Mandarin Chinese", value: "chi_sim" },
  { label: "Hindi", value: "hin" },
  { label: "Spanish", value: "spa" },
  { label: "French", value: "fra" },
  { label: "Arabic", value: "ara" },
  { label: "Bengali", value: "ben" },
] as const;

export type RecognitionLanguageValue = (typeof RECOGNITION_LANGUAGE_OPTIONS)[number]["value"];

type RecognitionLanguagePreference = readonly [
  () => RecognitionLanguageValue,
  (next: RecognitionLanguageValue) => void,
];

export const DEFAULT_VALUE: RecognitionLanguageValue = "auto";
const STORE_KEY = TEXT_SNAP_CONSTS.store.keys.recognition_lang;
const VALID_CODES = new Set<RecognitionLanguageValue>(
  RECOGNITION_LANGUAGE_OPTIONS.filter((option) => option.value !== DEFAULT_VALUE).map(
    (option) => option.value,
  ),
);

const ORDERED_CODES = RECOGNITION_LANGUAGE_OPTIONS.map((option) => option.value);

const sanitizeRecognitionLanguage = (stored: unknown): RecognitionLanguageValue => {
  if (typeof stored !== "string") {
    return DEFAULT_VALUE;
  }

  const trimmed = stored.trim() as RecognitionLanguageValue;
  if (!trimmed || trimmed.toLowerCase() === DEFAULT_VALUE) {
    return DEFAULT_VALUE;
  }

  const requested = new Set(
    trimmed
      .split("+")
      .map((code) => code.trim() as RecognitionLanguageValue)
      .filter((code) => code && VALID_CODES.has(code)),
  );

  if (requested.size === 0) {
    return DEFAULT_VALUE;
  }

  const ordered = ORDERED_CODES.filter((code) => code !== DEFAULT_VALUE && requested.has(code));

  if (ordered.length === 0) {
    return DEFAULT_VALUE;
  }

  return ordered.join("+") as RecognitionLanguageValue;
};

export abstract class RecognitionLanguage {
  private static _singleton: RecognitionLanguagePreference | null = null;

  static create(): RecognitionLanguagePreference {
    if (this._singleton) return this._singleton;

    const [storeValue, setStoreValue] =
      TextSnapStore.createValue<RecognitionLanguageValue>(STORE_KEY);
    const [preference, setPreference] = createSignal<RecognitionLanguageValue>(DEFAULT_VALUE);

    createEffect(() => {
      const stored = storeValue();
      if (stored === undefined) return;

      const sanitized = sanitizeRecognitionLanguage(stored);
      setPreference(sanitized);

      if (stored !== sanitized) {
        setStoreValue(sanitized).catch(() => {});
      }
    });

    function update(next: RecognitionLanguageValue) {
      const sanitized = sanitizeRecognitionLanguage(next);
      setPreference(sanitized);
      setStoreValue(sanitized).catch(() => {});
    }

    this._singleton = [preference, update] as const;
    return this._singleton;
  }
}

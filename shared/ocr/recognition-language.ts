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

const STORE_KEY = TEXT_SNAP_CONSTS.store.keys.recognition_lang;
const DEFAULT_VALUE: RecognitionLanguageValue = "auto";
const VALID_VALUES = new Set(RECOGNITION_LANGUAGE_OPTIONS.map((option) => option.value));

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

      if (stored && VALID_VALUES.has(stored)) {
        setPreference(stored);
      } else {
        setPreference(DEFAULT_VALUE);
        if (stored !== DEFAULT_VALUE) {
          setStoreValue(DEFAULT_VALUE).catch(() => {});
        }
      }
    });

    function update(next: RecognitionLanguageValue) {
      setPreference(next);
      setStoreValue(next).catch(() => {});
    }

    this._singleton = [preference, update] as const;
    return this._singleton;
  }
}

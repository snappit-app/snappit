import { createMemo, createSignal, onMount } from "solid-js";

import {
  DEFAULT_VALUE,
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr/recognition_language";

import {
  canDeleteLanguage,
  deleteLanguage,
  downloadLanguage,
  installedLanguages,
  isSystemLanguage,
  refreshInstalledLanguages,
} from "./installed_languages";

const MANUAL_RECOGNITION_OPTIONS = RECOGNITION_LANGUAGE_OPTIONS.filter(
  (option) => option.value !== DEFAULT_VALUE,
);
const MANUAL_RECOGNITION_OPTION_VALUES = MANUAL_RECOGNITION_OPTIONS.map((option) => option.value);

export function createRecognitionLanguages() {
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
  const [downloading, setDownloading] = createSignal<Set<string>>(new Set());

  onMount(() => {
    refreshInstalledLanguages();
  });

  const handleDownload = async (code: string) => {
    setDownloading((prev) => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });
    try {
      await downloadLanguage(code);
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    }
  };

  const deleteLang = async (lang: RecognitionLanguageValue) => {
    if (selectedManualLanguageSet().has(lang)) {
      selectedManualLanguageSet().delete(lang);
      toggleRecognitionLanguage(lang);
    }

    return deleteLanguage(lang);
  };

  const selectedManualLanguageCodes = createMemo<RecognitionLanguageValue[]>(() => {
    const current = recognitionLanguage();
    if (!current || current === DEFAULT_VALUE) return [];

    const parts = current
      .split("+")
      .map((code) => code.trim() as RecognitionLanguageValue)
      .filter(Boolean);

    return MANUAL_RECOGNITION_OPTION_VALUES.filter((code) => parts.includes(code));
  });

  const selectedManualLanguageSet = createMemo(() => new Set(selectedManualLanguageCodes()));

  const isAutoLanguageSelected = createMemo(() => {
    const current = recognitionLanguage();
    return !current || current === DEFAULT_VALUE || selectedManualLanguageCodes().length === 0;
  });

  const toggleRecognitionLanguage = (value: RecognitionLanguageValue) => {
    const current = new Set(selectedManualLanguageCodes());

    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }

    if (current.size === 0) {
      setRecognitionLanguage(DEFAULT_VALUE);
      return;
    }

    const ordered = MANUAL_RECOGNITION_OPTION_VALUES.filter((code) => current.has(code));
    setRecognitionLanguage(ordered.join("+") as RecognitionLanguageValue);
  };

  const sortedOptions = createMemo(() => {
    const installed = installedLanguages();
    const downloadingSet = downloading();

    const options = RECOGNITION_LANGUAGE_OPTIONS.filter((o) => o.value !== DEFAULT_VALUE);

    const downloaded = options.filter(
      (o) => installed.includes(o.value) || downloadingSet.has(o.value),
    );
    const others = options.filter(
      (o) => !installed.includes(o.value) && !downloadingSet.has(o.value),
    );

    return [...downloaded, ...others];
  });

  return {
    recognitionLanguage,
    setRecognitionLanguage,
    downloading,
    handleDownload,
    selectedManualLanguageSet,
    isAutoLanguageSelected,
    toggleRecognitionLanguage,
    sortedOptions,
    deleteLanguage: deleteLang,
    installedLanguages,
    isSystemLanguage,
    canDeleteLanguage,
  };
}

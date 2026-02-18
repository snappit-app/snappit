import { createEffect, createMemo, Show } from "solid-js";

import {
  DEFAULT_VALUE,
  Language,
  RECOGNITION_LANGUAGE_OPTIONS,
} from "@/shared/ocr/recognition_language";
import { TesseractLanguageList } from "@/shared/ocr/tesseract_language_list";
import { createRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";

export function MultiplatformLanguages() {
  const {
    sortedOptions,
    tesseractLanguageSet,
    installedLanguages,
    downloading,
    isSystemLanguage,
    isAutoLanguageSelected,
    setRecognitionLanguage,
    toggleRecognitionLanguage,
    handleDownload,
    deleteLanguage,
    canDeleteLanguage,
    isReady,
  } = createRecognitionLanguages();

  createEffect(() => {
    if (!isReady() || !isAutoLanguageSelected()) return;

    const installed = installedLanguages();
    if (installed.length === 0) return;

    const orderedInstalled = RECOGNITION_LANGUAGE_OPTIONS.filter(
      (option) => option.value !== DEFAULT_VALUE && installed.includes(option.value),
    ).map((option) => option.value);

    if (orderedInstalled.length === 0) return;

    setRecognitionLanguage(orderedInstalled.join("+") as Language);
  });

  const multiplatformSortedOptions = createMemo(() => {
    const options = sortedOptions();
    const systemOptions = options.filter((option) => isSystemLanguage(option.value));
    const otherOptions = options.filter((option) => !isSystemLanguage(option.value));
    return [...systemOptions, ...otherOptions];
  });

  const isLastSelectedLanguage = (lang: Language) => {
    const selected = tesseractLanguageSet();
    return selected.size === 1 && selected.has(lang);
  };

  const handleMultiplatformToggle = (lang: Language) => {
    if (isLastSelectedLanguage(lang)) return;
    toggleRecognitionLanguage(lang);
  };

  return (
    <Show when={isReady()}>
      <div class="border-t min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] p-3">
        <TesseractLanguageList
          options={multiplatformSortedOptions}
          installedLanguages={installedLanguages}
          downloading={downloading}
          selectedLanguages={tesseractLanguageSet}
          isSystemLanguage={isSystemLanguage}
          canDeleteLanguage={canDeleteLanguage}
          isToggleDisabled={isLastSelectedLanguage}
          onToggle={handleMultiplatformToggle}
          onDownload={handleDownload}
          onDelete={deleteLanguage}
        />
      </div>
    </Show>
  );
}

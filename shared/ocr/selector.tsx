import { For } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { DEFAULT_VALUE } from "@/shared/ocr/recognition_language";
import { useRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";

import { LanguageItem } from "./language_item";

export function RecognitionLanguageAutoOption() {
  const { setRecognitionLanguage, isAutoLanguageSelected } = useRecognitionLanguages();

  return (
    <>
      <button
        type="button"
        class={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-md p-2 text-left text-sm hover:bg-muted",
          isAutoLanguageSelected() ? "bg-muted" : "",
        )}
        aria-pressed={isAutoLanguageSelected()}
        onClick={() => setRecognitionLanguage(DEFAULT_VALUE)}
      >
        <span>Auto (system languages)</span>
      </button>
      <div class="border-t border-gray-300 my-1" />
    </>
  );
}

export function RecognitionLanguageManualList() {
  const {
    sortedOptions,
    selectedManualLanguageSet,
    installedLanguages,
    downloading,
    isSystemLanguage,
    toggleRecognitionLanguage,
    handleDownload,
    deleteLanguage,
  } = useRecognitionLanguages();

  return (
    <div class="flex flex-col gap-1">
      <For each={sortedOptions()}>
        {(option) => (
          <LanguageItem
            option={option}
            isSelected={selectedManualLanguageSet().has(option.value)}
            isInstalled={installedLanguages().includes(option.value)}
            isDownloading={downloading().has(option.value)}
            isSystem={isSystemLanguage(option.value)}
            onToggle={() => toggleRecognitionLanguage(option.value)}
            onDownload={() => handleDownload(option.value)}
            onDelete={() => deleteLanguage(option.value)}
          />
        )}
      </For>
    </div>
  );
}

export function RecognitionLanguageSelector() {
  return (
    <div class="flex flex-col gap-1">
      <RecognitionLanguageAutoOption />
      <RecognitionLanguageManualList />
    </div>
  );
}

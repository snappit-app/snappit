import { createMemo, For, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import {
  DEFAULT_VALUE,
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr/recognition_language";
import { Checkbox, CheckboxControl, CheckboxLabel } from "@/shared/ui/checkbox";

const MANUAL_RECOGNITION_OPTIONS = RECOGNITION_LANGUAGE_OPTIONS.filter(
  (option) => option.value !== DEFAULT_VALUE,
);
const MANUAL_RECOGNITION_OPTION_VALUES = MANUAL_RECOGNITION_OPTIONS.map((option) => option.value);

export function RecognitionLanguageSelector() {
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();

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

  return (
    <div class="flex flex-col gap-1">
      <For each={RECOGNITION_LANGUAGE_OPTIONS}>
        {(option) => (
          <>
            <Show when={option.value === DEFAULT_VALUE}>
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
            </Show>

            <Show when={option.value !== DEFAULT_VALUE}>
              <Checkbox
                class="flex items-center w-full relative"
                checked={selectedManualLanguageSet().has(option.value)}
                onChange={() => toggleRecognitionLanguage(option.value)}
              >
                <CheckboxLabel
                  class={cn(
                    "text-sm grow-1 cursor-pointer rounded-md font-medium leading-none p-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 hover:bg-muted",
                    selectedManualLanguageSet().has(option.value) ? "bg-muted" : "",
                  )}
                >
                  {option.label}
                </CheckboxLabel>
                <CheckboxControl color={"product"} class="absolute right-2" />
              </Checkbox>
            </Show>
          </>
        )}
      </For>
    </div>
  );
}

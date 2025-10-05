import { BiSolidHelpCircle } from "solid-icons/bi";
import { createMemo, createSignal, For, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import {
  DEFAULT_VALUE,
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr/recognition_language";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Checkbox, CheckboxControl, CheckboxLabel } from "@/shared/ui/checkbox";
import { tooltip } from "@/shared/ui/tooltip";

const AUTO_LABEL_FALLBACK = "Auto";
const AUTO_OPTION = RECOGNITION_LANGUAGE_OPTIONS.find((option) => option.value === DEFAULT_VALUE);
const MANUAL_RECOGNITION_OPTIONS = RECOGNITION_LANGUAGE_OPTIONS.filter(
  (option) => option.value !== DEFAULT_VALUE,
);
const MANUAL_RECOGNITION_OPTION_VALUES = MANUAL_RECOGNITION_OPTIONS.map((option) => option.value);

export function RecognitionLanguageSelector() {
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
  const [isOpen, setOpen] = createSignal(false);

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

  const selectedRecognitionLanguageLabel = createMemo(() => {
    if (isAutoLanguageSelected()) {
      return AUTO_OPTION?.label ?? AUTO_LABEL_FALLBACK;
    }

    const labels = MANUAL_RECOGNITION_OPTIONS.filter((option) =>
      selectedManualLanguageSet().has(option.value),
    ).map((option) => option.label);

    if (labels.length === 0) {
      return AUTO_OPTION?.label ?? AUTO_LABEL_FALLBACK;
    }

    return labels.join(", ");
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
    <Accordion
      class="border rounded-lg"
      collapsible
      value={isOpen() ? ["recognition-language"] : []}
      onChange={(value) => setOpen(value.includes("recognition-language"))}
    >
      <AccordionItem value="recognition-language" class="border-none">
        <AccordionTrigger class="px-4 py-3 text-left">
          <span class="flex flex-1 justify-between gap-4">
            <span class="whitespace-nowrap relative">
              Recognition Language
              <div
                class="absolute -right-4 top-0"
                use:tooltip={"Selecting multiple languages may slow down recognition."}
              >
                <BiSolidHelpCircle class="w-3 h-3" />
              </div>
            </span>
            <span
              use:tooltip={{ content: selectedRecognitionLanguageLabel() }}
              class="text-sm text-muted-foreground whitespace-nowrap truncate max-w-30"
            >
              {selectedRecognitionLanguageLabel()}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent class="px-4">
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
                      <CheckboxControl class="absolute right-2" />
                    </Checkbox>
                  </Show>
                </>
              )}
            </For>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

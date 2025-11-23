import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { FiDownload, FiTrash2 } from "solid-icons/fi";

import { cn } from "@/shared/libs/cn";
import {
  DEFAULT_VALUE,
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr/recognition_language";
import { Checkbox, CheckboxControl, CheckboxLabel } from "@/shared/ui/checkbox";
import {
  deleteLanguage,
  downloadLanguage,
  installedLanguages,
  refreshInstalledLanguages,
  isSystemLanguage,
} from "./installed_languages";

const MANUAL_RECOGNITION_OPTIONS = RECOGNITION_LANGUAGE_OPTIONS.filter(
  (option) => option.value !== DEFAULT_VALUE,
);
const MANUAL_RECOGNITION_OPTION_VALUES = MANUAL_RECOGNITION_OPTIONS.map((option) => option.value);

export function RecognitionLanguageSelector() {
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
              <div class={cn("flex items-center w-full relative p-2 rounded-md group", 
                  selectedManualLanguageSet().has(option.value) ? "bg-muted" : "hover:bg-muted"
              )}>
                <Show
                  when={installedLanguages().includes(option.value)}
                  fallback={
                    <>
                      <span class="text-sm font-medium grow text-muted-foreground">
                        {option.label}
                      </span>
                      <button
                        onClick={() => handleDownload(option.value)}
                        disabled={downloading().has(option.value)}
                        class="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Download language"
                      >
                        <Show
                          when={downloading().has(option.value)}
                          fallback={<FiDownload size={16} />}
                        >
                          <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        </Show>
                      </button>
                    </>
                  }
                >
                  <Checkbox
                    class="flex items-center grow"
                    checked={selectedManualLanguageSet().has(option.value)}
                    onChange={() => toggleRecognitionLanguage(option.value)}
                  >
                    <CheckboxLabel class="text-sm font-medium grow cursor-pointer leading-none">
                      {option.label}
                    </CheckboxLabel>
                    <CheckboxControl color={"product"} />
                  </Checkbox>
                  <Show
                    when={!isSystemLanguage(option.value)}
                    fallback={
                        <div class="ml-2 p-1 text-muted-foreground opacity-50 cursor-not-allowed" title="System language">
                            <span class="text-xs border px-1 rounded">System</span>
                        </div>
                    }
                  >
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        deleteLanguage(option.value);
                        }}
                        class="ml-2 p-1 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete language"
                    >
                        <FiTrash2 size={16} />
                    </button>
                  </Show>
                </Show>
              </div>
            </Show>
          </>
        )}
      </For>
    </div>
  );
}

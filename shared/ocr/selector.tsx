import { FiDownload, FiTrash2 } from "solid-icons/fi";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import {
  DEFAULT_VALUE,
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr/recognition_language";
import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";

import {
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

export function RecognitionLanguageAutoOption() {
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

  const isAutoLanguageSelected = createMemo(() => {
    const current = recognitionLanguage();
    return !current || current === DEFAULT_VALUE || selectedManualLanguageCodes().length === 0;
  });

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
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
  const [downloading, setDownloading] = createSignal<Set<string>>(new Set());

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

    const system = options.filter((o) => isSystemLanguage(o.value));
    const downloaded = options.filter(
      (o) =>
        !isSystemLanguage(o.value) && (installed.includes(o.value) || downloadingSet.has(o.value)),
    );
    const others = options.filter(
      (o) =>
        !isSystemLanguage(o.value) && !installed.includes(o.value) && !downloadingSet.has(o.value),
    );

    return [...system, ...downloaded, ...others];
  });

  onMount(() => {
    refreshInstalledLanguages();
  });

  return (
    <div class="flex flex-col gap-1">
      <For each={sortedOptions()}>
        {(option) => (
          <div
            class={cn(
              "flex items-center w-full relative p-2 rounded-md group cursor-pointer",
              selectedManualLanguageSet().has(option.value) ? "bg-muted" : "hover:bg-muted",
            )}
            onClick={() => {
              if (installedLanguages().includes(option.value)) {
                toggleRecognitionLanguage(option.value);
              } else if (!downloading().has(option.value)) {
                handleDownload(option.value);
              }
            }}
          >
            <div class="flex items-center grow gap-2">
              <span class="text-sm font-medium leading-none">{option.label}</span>

              <Show when={installedLanguages().includes(option.value)}>
                <Show
                  when={!isSystemLanguage(option.value)}
                  fallback={
                    <div
                      class="text-muted-foreground opacity-50 cursor-not-allowed"
                      title="System language"
                    >
                      <span class="text-[10px] border px-1 rounded uppercase">System</span>
                    </div>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLanguage(option.value);
                    }}
                    class="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                    title="Delete language"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </Show>
              </Show>
            </div>

            <Show
              when={installedLanguages().includes(option.value)}
              fallback={
                <Show when={downloading().has(option.value)} fallback={<FiDownload size={16} />}>
                  <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                </Show>
              }
            >
              <Checkbox
                class="flex items-center"
                checked={selectedManualLanguageSet().has(option.value)}
                onChange={() => toggleRecognitionLanguage(option.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <CheckboxControl color={"product"} />
              </Checkbox>
            </Show>
          </div>
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

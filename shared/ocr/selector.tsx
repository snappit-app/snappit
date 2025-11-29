import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";

import { cn } from "@/shared/libs/cn";

import { LanguageItem } from "./language_item";
import { DEFAULT_VALUE, RecognitionLanguageValue } from "./recognition_language";
import { useRecognitionLanguages } from "./use_recognition_languages";

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

  const [activeValue, setActiveValue] = createSignal<RecognitionLanguageValue | null>(null);
  const [typeaheadQuery, setTypeaheadQuery] = createSignal("");
  const itemRefs = new Map<RecognitionLanguageValue, HTMLDivElement>();
  let lastTypeAt = 0;
  const TYPEAHEAD_RESET_MS = 1000;

  const activateOption = (value: RecognitionLanguageValue) => {
    setActiveValue(value);
    const element = itemRefs.get(value);
    if (element) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "center" });
    }
  };

  const findMatch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setActiveValue(null);
      return;
    }

    const match = sortedOptions().find((option) => {
      const label = option.label.toLowerCase();
      const code = option.value.toLowerCase();
      return label.includes(normalized) || code.includes(normalized);
    });

    if (match) {
      activateOption(match.value);
      return;
    }

    setActiveValue(null);
  };

  createEffect(() => {
    const currentActive = activeValue();
    if (!currentActive) return;

    if (!sortedOptions().some((option) => option.value === currentActive)) {
      setActiveValue(null);
    }
  });

  const handleTypeahead = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, button")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Escape") {
      setTypeaheadQuery("");
      setActiveValue(null);
      return;
    }

    if (event.key === "Backspace") {
      const nextQuery = typeaheadQuery().slice(0, -1);
      setTypeaheadQuery(nextQuery);
      if (!nextQuery) {
        setActiveValue(null);
        return;
      }
      findMatch(nextQuery);
      return;
    }

    if (event.key.length === 1) {
      const now = Date.now();
      const baseQuery = now - lastTypeAt > TYPEAHEAD_RESET_MS ? "" : typeaheadQuery();
      lastTypeAt = now;
      const nextQuery = (baseQuery + event.key).toLowerCase();
      setTypeaheadQuery(nextQuery);
      findMatch(nextQuery);
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleTypeahead);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleTypeahead);
  });

  return (
    <div
      class="flex flex-col gap-1"
      role="listbox"
      aria-label="Manual recognition languages. Type to search."
    >
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
            isActive={activeValue() === option.value}
            itemRef={(el) => itemRefs.set(option.value, el)}
            onFocusItem={() => setActiveValue(option.value)}
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

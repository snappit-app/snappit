import { createEventListener } from "@solid-primitives/event-listener";
import { FiDownload } from "solid-icons/fi";
import { Accessor, createSignal, For, onCleanup, Show } from "solid-js";

import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";
import { Tag } from "@/shared/ui/tag";

import { Button } from "../ui/button";
import { isMacOS } from "./installed_languages";
import { Language, RecognitionLanguageOption } from "./recognition_language";

export interface TesseractLanguageListProps {
  options: Accessor<RecognitionLanguageOption[]>;
  installedLanguages: Accessor<string[]>;
  downloading: Accessor<Set<string>>;
  selectedLanguages: Accessor<Set<Language>>;
  isSystemLanguage: (lang: Language) => boolean;
  canDeleteLanguage: (lang: Language) => boolean;
  isToggleDisabled?: (lang: Language) => boolean;
  showSystemTag?: boolean;
  onToggle: (lang: Language) => void;
  onDownload: (lang: Language) => void;
  onDelete: (lang: Language) => void;
}

export function TesseractLanguageList(props: TesseractLanguageListProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [highlightedValue, setHighlightedValue] = createSignal<string | null>(null);
  let resetTimeoutId: number | undefined;
  const TYPEAHEAD_RESET_MS = 1200;

  const resetSearch = () => {
    setSearchQuery("");
    setHighlightedValue(null);
  };

  const scheduleReset = () => {
    if (resetTimeoutId !== undefined) {
      clearTimeout(resetTimeoutId);
    }
    resetTimeoutId = window.setTimeout(resetSearch, TYPEAHEAD_RESET_MS);
  };

  onCleanup(() => {
    if (resetTimeoutId !== undefined) {
      clearTimeout(resetTimeoutId);
    }
  });

  const handleTypeahead = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Escape") {
      if (resetTimeoutId !== undefined) {
        clearTimeout(resetTimeoutId);
        resetTimeoutId = undefined;
      }
      resetSearch();
      return;
    }

    if (event.key === "Backspace") {
      const nextQuery = searchQuery().slice(0, -1);
      setSearchQuery(nextQuery);
      if (!nextQuery) {
        if (resetTimeoutId !== undefined) {
          clearTimeout(resetTimeoutId);
          resetTimeoutId = undefined;
        }
        setHighlightedValue(null);
        return;
      }
      findAndHighlight(nextQuery);
      scheduleReset();
      return;
    }

    if (event.key.length === 1) {
      const nextQuery = (searchQuery() + event.key).toLowerCase();
      setSearchQuery(nextQuery);
      findAndHighlight(nextQuery);
      scheduleReset();
    }
  };

  const findAndHighlight = (query: string) => {
    const options = props.options();
    const normalized = query.toLowerCase();

    let startWithMatch: string | null = null;
    let includesMatch: string | null = null;

    for (const option of options) {
      const labelLower = option.label.toLowerCase();
      const valueLower = option.value.toLowerCase();

      if (labelLower.startsWith(normalized) && !startWithMatch) {
        startWithMatch = option.value;
      }
      if ((labelLower.includes(normalized) || valueLower.includes(normalized)) && !includesMatch) {
        includesMatch = option.value;
      }
    }

    const match = startWithMatch ?? includesMatch;
    if (match) {
      setHighlightedValue(match);
      const element = document.querySelector(`[data-language-value="${match}"]`) as HTMLElement;
      if (element) {
        const scrollContainer = findScrollableParent(element);
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollTop =
            scrollContainer.scrollTop +
            (elementRect.top - containerRect.top) -
            containerRect.height / 2 +
            elementRect.height / 2;
          scrollContainer.scrollTop = scrollTop;
        }
      }
    } else {
      setHighlightedValue(null);
    }
  };

  const findScrollableParent = (element: HTMLElement): HTMLElement | null => {
    let parent = element.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  };

  createEventListener(window, "keydown", handleTypeahead);

  return (
    <div>
      <For each={props.options()}>
        {(option) => {
          const isInstalled = () => props.installedLanguages().includes(option.value);
          const isDownloading = () => props.downloading().has(option.value);
          const isSelected = () => props.selectedLanguages().has(option.value);
          const isSystem = () => props.isSystemLanguage(option.value);
          const isHighlighted = () => highlightedValue() === option.value;
          const isToggleDisabled = () => props.isToggleDisabled?.(option.value) ?? false;
          const showSystemTag = () => props.showSystemTag ?? true;

          const handleClick = () => {
            if (isInstalled()) {
              if (isToggleDisabled()) return;
              props.onToggle(option.value);
            } else if (!isDownloading()) {
              props.onDownload(option.value);
            }
          };

          return (
            <button
              class="p-2 block border-b last:border-b-0 w-full group"
              classList={{
                "bg-accent/50 rounded": isHighlighted(),
              }}
              data-language-value={option.value}
              onClick={handleClick}
            >
              <div class="flex items-center cursor-default justify-between">
                <div class="flex gap-2 items-center">
                  <Show when={isInstalled()}>
                    <Checkbox
                      class="flex items-center"
                      checked={isSelected()}
                      disabled={isToggleDisabled()}
                      onChange={() => {
                        if (isToggleDisabled()) return;
                        props.onToggle(option.value);
                      }}
                      onClick={(e: MouseEvent) => e.stopPropagation()}
                    >
                      <CheckboxControl color={"product"} />
                    </Checkbox>
                  </Show>

                  <Show when={!isInstalled() && !isDownloading()}>
                    <FiDownload size={16} />
                  </Show>

                  <Show when={isDownloading()}>
                    <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  </Show>

                  <span class="text-sm font-medium leading-none py-1">{option.label}</span>
                </div>

                <div class="flex items-center gap-2">
                  <Show when={isInstalled() && props.canDeleteLanguage(option.value)}>
                    <Button
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        props.onDelete(option.value);
                      }}
                      variant={"muted"}
                      size={"sm"}
                      class="opacity-0 group-hover:opacity-100 focus:opacity-100 window-inactive:!opacity-0"
                      title="Delete language"
                    >
                      Delete
                    </Button>
                  </Show>

                  <Show when={isInstalled() && isSystem() && !isMacOS() && showSystemTag()}>
                    <Tag>system</Tag>
                  </Show>
                </div>
              </div>
            </button>
          );
        }}
      </For>
    </div>
  );
}

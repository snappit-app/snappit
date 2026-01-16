import { createEventListener } from "@solid-primitives/event-listener";
import { FiDownload } from "solid-icons/fi";
import { Accessor, createMemo, createSignal, For, Show } from "solid-js";

import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";
import { Tag } from "@/shared/ui/tag";

import { Button } from "../ui/button";
import { isMacOS } from "./installed_languages";
import { RecognitionLanguageOption, RecognitionLanguageValue } from "./recognition_language";

export interface TesseractLanguageListProps {
  options: Accessor<RecognitionLanguageOption[]>;
  installedLanguages: Accessor<string[]>;
  downloading: Accessor<Set<string>>;
  selectedLanguages: Accessor<Set<RecognitionLanguageValue>>;
  isSystemLanguage: (lang: string) => boolean;
  canDeleteLanguage: (lang: string) => boolean;
  onToggle: (lang: RecognitionLanguageValue) => void;
  onDownload: (lang: string) => void;
  onDelete: (lang: RecognitionLanguageValue) => void;
}

export function TesseractLanguageList(props: TesseractLanguageListProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [highlightedValue, setHighlightedValue] = createSignal<string | null>(null);
  let lastTypeAt = 0;
  const TYPEAHEAD_RESET_MS = 1000;

  const filteredOptions = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return props.options();

    return props
      .options()
      .filter(
        (option) =>
          option.label.toLowerCase().includes(query) || option.value.toLowerCase().includes(query),
      );
  });

  const handleTypeahead = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Escape") {
      setSearchQuery("");
      setHighlightedValue(null);
      return;
    }

    if (event.key === "Backspace") {
      const nextQuery = searchQuery().slice(0, -1);
      setSearchQuery(nextQuery);
      if (!nextQuery) {
        setHighlightedValue(null);
        return;
      }
      findAndHighlight(nextQuery);
      return;
    }

    if (event.key.length === 1) {
      const now = Date.now();
      const baseQuery = now - lastTypeAt > TYPEAHEAD_RESET_MS ? "" : searchQuery();
      lastTypeAt = now;
      const nextQuery = (baseQuery + event.key).toLowerCase();
      setSearchQuery(nextQuery);
      findAndHighlight(nextQuery);
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
      const element = document.querySelector(`[data-language-value="${match}"]`);
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      setHighlightedValue(null);
    }
  };

  createEventListener(window, "keydown", handleTypeahead);

  return (
    <div class="rounded-lg bg-card px-3 py-1">
      <For each={filteredOptions()}>
        {(option) => {
          const isInstalled = () => props.installedLanguages().includes(option.value);
          const isDownloading = () => props.downloading().has(option.value);
          const isSelected = () => props.selectedLanguages().has(option.value);
          const isSystem = () => props.isSystemLanguage(option.value);
          const isHighlighted = () => highlightedValue() === option.value;

          const handleClick = () => {
            if (isInstalled()) {
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
                      onChange={() => props.onToggle(option.value)}
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
                      class="opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete language"
                    >
                      Delete
                    </Button>
                  </Show>

                  <Show when={isInstalled() && isSystem() && !isMacOS()}>
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

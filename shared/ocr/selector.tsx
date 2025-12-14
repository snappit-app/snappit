import { BsQuestionCircleFill } from "solid-icons/bs";
import { FiDownload, FiTrash2 } from "solid-icons/fi";
import { For, Show } from "solid-js";

import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";
import {
  InlineSelectList,
  InlineSelectListContent,
  InlineSelectListDefaultItem,
  InlineSelectListHeader,
  InlineSelectListItem,
} from "@/shared/ui/inline_select_list";
import { Tag } from "@/shared/ui/tag";
import { tooltip } from "@/shared/ui/tooltip";

import { DEFAULT_VALUE } from "./recognition_language";
import { useRecognitionLanguages } from "./use_recognition_languages";

void tooltip;

export function RecognitionLanguageSelector() {
  const {
    sortedOptions,
    selectedManualLanguageSet,
    installedLanguages,
    downloading,
    isSystemLanguage,
    isAutoLanguageSelected,
    setRecognitionLanguage,
    toggleRecognitionLanguage,
    handleDownload,
    deleteLanguage,
  } = useRecognitionLanguages();

  const handleSelectDefault = () => {
    setRecognitionLanguage(DEFAULT_VALUE);
  };

  return (
    <InlineSelectList
      aria-label="Recognition languages. Type to search."
      onSelectDefault={handleSelectDefault}
    >
      <InlineSelectListHeader class="border-b pb-2">
        <InlineSelectListDefaultItem
          class="flex items-center gap-1"
          selected={isAutoLanguageSelected()}
        >
          <span class="text-sm">Auto (system languages)</span>

          <div
            use:tooltip="Type to search and jump to a language in the list"
            class="text-muted-foreground text-xs"
          >
            <BsQuestionCircleFill />
          </div>
        </InlineSelectListDefaultItem>
      </InlineSelectListHeader>

      <InlineSelectListContent>
        <For each={sortedOptions()}>
          {(option) => {
            const isInstalled = () => installedLanguages().includes(option.value);
            const isDownloading = () => downloading().has(option.value);
            const isSelected = () => selectedManualLanguageSet().has(option.value);
            const isSystem = () => isSystemLanguage(option.value);

            const handleClick = () => {
              if (isInstalled()) {
                toggleRecognitionLanguage(option.value);
              } else if (!isDownloading()) {
                handleDownload(option.value);
              }
            };

            return (
              <InlineSelectListItem value={option.value} label={option.label} onClick={handleClick}>
                <div class="flex items-center gap-2 cursor-default">
                  <Show when={isInstalled()}>
                    <Checkbox
                      class="flex items-center"
                      checked={isSelected()}
                      onChange={() => toggleRecognitionLanguage(option.value)}
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

                  <Show when={isInstalled() && !isSystem()}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLanguage(option.value);
                      }}
                      class="text-muted-foreground  hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
                      title="Delete language"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </Show>

                  <Show when={isInstalled() && isSystem()}>
                    <Tag>system</Tag>
                  </Show>
                </div>
              </InlineSelectListItem>
            );
          }}
        </For>
      </InlineSelectListContent>
    </InlineSelectList>
  );
}

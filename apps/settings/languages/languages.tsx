import { BsQuestionCircleFill } from "solid-icons/bs";
import { FiDownload, FiTrash2 } from "solid-icons/fi";
import { createMemo, For, Show } from "solid-js";

import { RecognitionLanguageSelector } from "@/shared/ocr";
import { isMacOS } from "@/shared/ocr/installed_languages";
import { createRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
import { Button } from "@/shared/ui/button";
import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";
import { Tag } from "@/shared/ui/tag";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export function Languages() {
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
    canDeleteLanguage,
  } = createRecognitionLanguages();

  const modelLabel = createMemo(() => (isAutoLanguageSelected() ? "macOS Vision" : "Tesseract"));
  const modelHint = createMemo(() =>
    isAutoLanguageSelected()
      ? "System languages are active, macOS Vision is used."
      : "Custom languages are selected, Tesseract will be used.",
  );

  return (
    <div class="p-3 pb-0 flex flex-col min-h-0 h-full">
      <h2 class="shrink-0 text-center text-bold mb-3 font-bold text-xl">Languages</h2>

      <div class="flex items-center justify-between p-3 rounded-lg bg-card mb-3">
        <span class="tracking-wide text-[10px] text-muted-foreground text-xs">
          Recognition model
        </span>
        <span use:tooltip={modelHint()}>
          <Tag>
            <div class="flex items-center gap-1">
              {modelLabel()}
              <BsQuestionCircleFill />
            </div>
          </Tag>
        </span>
      </div>

      <div class="border-t pt-3 flex flex-col gap-1 pb-3 -ml-3 pl-3 -mr-3 pr-3 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <div class="mb-3">
          <button class="bg-muted p-3 flex flex-col items-start text-accent-foreground w-full rounded-md active:brightness-90">
            <div class="text-md flex justify-between w-full items-center">
              System
              <div class="flex gap-3 items-center">
                <div use:tooltip={"asd"} class="text-muted-foreground text-xs">
                  <BsQuestionCircleFill size={16} />
                </div>
              </div>
            </div>
            <div class="text-xs text-muted-foreground items-center gap-1">
              <span>English, Russian</span>
            </div>
          </button>
        </div>

        <div class="text-sm text-muted-foreground">Tesseract Languages</div>
        <div class="rounded-lg bg-card px-3 py-1">
          <For each={sortedOptions()}>
            {(option) => {
              const isInstalled = () => installedLanguages().includes(option.value);
              const isDownloading = () => downloading().has(option.value);
              const isSelected = () => selectedManualLanguageSet().has(option.value);
              const isSystem = () => isSystemLanguage(option.value);

              const handleClick = () => {
                console.log("asd");
                if (isInstalled()) {
                  toggleRecognitionLanguage(option.value);
                } else if (!isDownloading()) {
                  handleDownload(option.value);
                }
              };

              return (
                <button class="p-2 block border-b last:border-b-0 w-full" onClick={handleClick}>
                  <div class="flex items-center cursor-default justify-between ">
                    <div class="flex gap-2">
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
                    </div>

                    <Show when={isInstalled() && canDeleteLanguage(option.value)}>
                      <Button
                        variant="muted"
                        size="sm"
                        onClick={() => deleteLanguage(option.value)}
                      >
                        Delete
                      </Button>
                    </Show>

                    <Show when={isInstalled() && isSystem() && !isMacOS()}>
                      <Tag>system</Tag>
                    </Show>
                  </div>
                </button>
              );
            }}
          </For>
        </div>
        {/*<RecognitionLanguageSelector />*/}
      </div>
    </div>
  );
}

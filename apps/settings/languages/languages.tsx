import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { RecognitionLanguageAutoOption, RecognitionLanguageManualList } from "@/shared/ocr";
import { useRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { Tag } from "@/shared/ui/tag";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export function Languages() {
  const recognition = useRecognitionLanguages();

  const usesVision = createMemo(() => {
    if (recognition.isAutoLanguageSelected()) return true;

    const selected = recognition.selectedManualLanguageSet();
    if (selected.size === 0) return true;

    for (const code of selected) {
      if (!recognition.isSystemLanguage(code)) return false;
    }

    return true;
  });

  const modelLabel = createMemo(() => (usesVision() ? "macOS Vision" : "Tesseract"));
  const modelHint = createMemo(() =>
    usesVision()
      ? "System languages are active, macOS Vision is used."
      : "Custom languages are selected, Tesseract will be used.",
  );

  return (
    <>
      <div class="p-3 mb-3 rounded-lg bg-card">
        <RecognitionLanguageAutoOption />
        {/*<Switch class="flex justify-between items-center h-[30px]">
          <SwitchLabel class="text-sm font-light">Auto (system languages)</SwitchLabel>
          <SwitchControl variant={"product"}>
            <SwitchThumb />
          </SwitchControl>
        </Switch>*/}
      </div>

      <div class="h-full flex flex-col rounded-lg bg-card overflow-hidden pt-3 mb-3 relative">
        {/*<div class="flex justify-end mb-3 text-xs pr-4 absolute right-4 -top-1">
          <div use:tooltip={"Type to search and jump to a language in the list"}>
            <BsQuestionCircleFill />
          </div>
        </div>*/}

        <div class="grow overflow-auto px-3 pr-1">
          <RecognitionLanguageManualList />
        </div>
      </div>

      <footer class="flex justify-between border-t px-3 py-2 text-xs space-y-1 p-3 rounded-lg bg-card mb-3">
        <span class="tracking-wide text-[10px] text-muted-foreground text-xs">
          recognition model
        </span>
        <span use:tooltip={modelHint()}>
          <Tag>
            <div class="flex items-center gap-1">
              {modelLabel()}
              <BsQuestionCircleFill />
            </div>
          </Tag>
        </span>
      </footer>
    </>
  );
}

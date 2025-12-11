import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { RecognitionLanguageAutoOption, RecognitionLanguageManualList } from "@/shared/ocr";
import { useRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
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
    <div class="h-full flex flex-col border rounded-lg overflow-hidden pt-3">
      <div class="px-3 pr-5">
        <RecognitionLanguageAutoOption />
      </div>

      <div class="grow overflow-auto px-3 pr-1 max-h-[300px]">
        <RecognitionLanguageManualList />
      </div>

      <footer class="flex justify-end border-t px-3 py-2 text-xs space-y-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="uppercase tracking-wide text-[10px] text-muted-foreground">
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
      </footer>
    </div>

    // <div class="h-full flex flex-col border rounded-lg overflow-hidden p-3">
    //   <div class="pb-0">
    //     <RecognitionLanguageAutoOption />
    //   </div>

    //   <div class="grow overflow-auto">
    //     <RecognitionLanguageManualList />
    //   </div>

    //   <footer class="flex justify-end border px-3 py-2 text-xs space-y-1">
    //     <div class="flex flex-wrap items-center gap-2">
    //       <span class="uppercase tracking-wide text-[10px] text-muted-foreground">
    //         Recognition model
    //       </span>
    //       <span use:tooltip={modelHint()}>
    //         <Tag>
    //           <div class="flex items-center gap-1">
    //             {modelLabel()}
    //             <BsQuestionCircleFill />
    //           </div>
    //         </Tag>
    //       </span>
    //     </div>
    //   </footer>
    // </div>
  );
}

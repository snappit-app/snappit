import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { RecognitionLanguageAutoOption, RecognitionLanguageManualList } from "@/shared/ocr";
import { useRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
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
    <div class="h-full flex flex-col p-6">
      <div class="h-full flex flex-col border rounded-lg overflow-hidden">
        <div class="p-5 z-10 space-y-3">
          <div class="space-y-1">
            <h2 class="font-bold text-lg">Language selection</h2>
            <p class="text-sm text-muted-foreground">
              Choose the languages you want the app to search for
              <br />
              Selecting more languages may make the search a bit slower
            </p>
          </div>
        </div>

        <div class="px-5 pb-0">
          <RecognitionLanguageAutoOption />
        </div>

        <div class="grow overflow-auto p-1 pl-5">
          <RecognitionLanguageManualList />
        </div>

        <div class="flex justify-end border px-3 py-2 text-xs space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="uppercase tracking-wide text-[10px] text-muted-foreground">
              Recognition model
            </span>
            <span
              use:tooltip={modelHint()}
              class="px-2 py-[2px] flex items-center gap-1 rounded-full text-[11px] font-semibold bg-product text-product-foreground"
            >
              {modelLabel()}
              <BsQuestionCircleFill />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

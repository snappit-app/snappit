import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { RecognitionLanguageSelector } from "@/shared/ocr";
import { useRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
import { Tag } from "@/shared/ui/tag";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export function Languages() {
  const recognition = useRecognitionLanguages();

  const usesVision = createMemo(() => {
    return recognition.isAutoLanguageSelected();
  });

  const modelLabel = createMemo(() => (usesVision() ? "macOS Vision" : "Tesseract"));
  const modelHint = createMemo(() =>
    usesVision()
      ? "System languages are active, macOS Vision is used."
      : "Custom languages are selected, Tesseract will be used.",
  );

  return (
    <div class="p-3">
      <h2 class="text-center text-bold mb-3 font-bold text-xl">Languages</h2>

      <div class="h-[419px] flex flex-col rounded-lg bg-card overflow-hidden p-3 mb-3 relative">
        <RecognitionLanguageSelector />
      </div>

      <footer class="flex items-center justify-between p-3 rounded-lg bg-card">
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
    </div>
  );
}

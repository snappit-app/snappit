import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { DEFAULT_VALUE } from "@/shared/ocr/recognition_language";
import { SystemLanguageButton } from "@/shared/ocr/system_language_button";
import { TesseractLanguageList } from "@/shared/ocr/tesseract_language_list";
import { createRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
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

  const handleSelectSystem = () => {
    setRecognitionLanguage(DEFAULT_VALUE);
  };

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
          <SystemLanguageButton
            isSelected={isAutoLanguageSelected()}
            onSelect={handleSelectSystem}
          />
        </div>

        <div class="text-sm text-muted-foreground">Tesseract Languages</div>
        <TesseractLanguageList
          options={sortedOptions}
          installedLanguages={installedLanguages}
          downloading={downloading}
          selectedLanguages={selectedManualLanguageSet}
          isSystemLanguage={isSystemLanguage}
          canDeleteLanguage={canDeleteLanguage}
          onToggle={toggleRecognitionLanguage}
          onDownload={handleDownload}
          onDelete={deleteLanguage}
        />
      </div>
    </div>
  );
}

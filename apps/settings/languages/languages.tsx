import { createMemo, onMount } from "solid-js";

import { refreshSystemLanguagesInfo, systemLanguagesInfo } from "@/shared/ocr/installed_languages";
import { DEFAULT_VALUE, RECOGNITION_LANGUAGE_OPTIONS } from "@/shared/ocr/recognition_language";
import { TesseractLanguageList } from "@/shared/ocr/tesseract_language_list";
import { createRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
import { RadioGroup, RadioGroupItemCard } from "@/shared/ui/radio_group";

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

  onMount(() => {
    refreshSystemLanguagesInfo();
  });

  const visionLanguagesText = createMemo(() => {
    const info = systemLanguagesInfo();
    if (info.length === 0) return "Loading...";
    return info.map((lang) => lang.name).join(", ");
  });

  const tesseractSelectedText = createMemo(() => {
    const selected = selectedManualLanguageSet();
    if (selected.size === 0) return null;

    const labels = RECOGNITION_LANGUAGE_OPTIONS.filter(
      (opt) => opt.value !== DEFAULT_VALUE && selected.has(opt.value),
    ).map((opt) => opt.label);

    return labels.join(", ");
  });

  const handleEngineChange = (value: string) => {
    if (value === "vision") {
      setRecognitionLanguage(DEFAULT_VALUE);
    } else if (value === "tesseract") {
      const installed = installedLanguages();

      installed.forEach((language) => {
        toggleRecognitionLanguage(language);
      });
    }
  };

  return (
    <div class="p-3 h-full">
      <RadioGroup
        class="min-h-0 h-full"
        variant="product"
        value={isAutoLanguageSelected() ? "vision" : "tesseract"}
        onChange={handleEngineChange}
      >
        <h2 class="shrink-0 text-center text-bold font-bold text-xl">Languages</h2>

        <RadioGroupItemCard value="vision" header="MacOS Vision" class="bg-card p-3 rounded-lg">
          <div class="text-xs text-muted-foreground border-b pb-3 mb-3 truncate">
            {visionLanguagesText()}
          </div>

          <div class="text-xs pr-8 text-muted-foreground">
            Snappit will use macOS built-in OCR for language recognition, which provides the best
            accuracy and speed for printed text.
          </div>
        </RadioGroupItemCard>

        <RadioGroupItemCard
          value="tesseract"
          header="Tesseract"
          class="flex flex-col bg-card rounded-lg grow-1 min-h-0 p-3 pb-0"
        >
          <div class="border-b pb-3 mb-3 pr-6">
            <div class="text-xs text-muted-foreground truncate">
              {tesseractSelectedText() ?? "Download languages to enable Tesseract"}
            </div>
          </div>

          <div class="text-xs pr-8 text-muted-foreground">
            Tesseract provides better quality for handwritten text and a wider choice of languages.
          </div>

          <div class="overflow-y-auto [scrollbar-gutter:stable] border-t px-3 py-2 -mx-3 mt-3">
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
        </RadioGroupItemCard>
      </RadioGroup>
    </div>
  );
}

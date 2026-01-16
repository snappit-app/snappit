import { DEFAULT_VALUE } from "@/shared/ocr/recognition_language";
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
          <div class="text-xs text-muted-foreground border-b pb-3 mb-3 mt-2">English, Russian</div>

          <div class="text-xs pr-8 text-muted-foreground">
            Snappit will use macOS built-in OCR for language recognition, which provides the best
            accuracy and speed for printed text.
          </div>
        </RadioGroupItemCard>

        <RadioGroupItemCard
          value="tesseract"
          header="Tesseract"
          class="flex flex-col bg-card rounded-lg grow-1 min-h-0 p-3"
        >
          <div class="text-xs text-muted-foreground border-b pb-3 mb-3 mt-2">
            <div>Download languages to enable Tesseract</div>
          </div>

          <div class="text-xs pr-8 text-muted-foreground">
            Tesseract provides better quality for handwritten text and a wider choice of languages.
          </div>

          <div class="overflow-y-auto [scrollbar-gutter:stable] border-t p-3 -mx-3 mt-3">
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

import { BiSolidError } from "solid-icons/bi";
import { createMemo, onMount, Show } from "solid-js";

import { refreshSystemLanguagesInfo, systemLanguagesInfo } from "@/shared/ocr/installed_languages";
import { DEFAULT_VALUE, RECOGNITION_LANGUAGE_OPTIONS } from "@/shared/ocr/recognition_language";
import { TesseractLanguageList } from "@/shared/ocr/tesseract_language_list";
import { createRecognitionLanguages } from "@/shared/ocr/use_recognition_languages";
import { RadioGroup, RadioGroupItemCard } from "@/shared/ui/radio_group";

export function Languages() {
  const {
    sortedOptions,
    tesseractLanguageSet,
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
    const selected = tesseractLanguageSet();
    const installed = installedLanguages();

    if (!installed.length) return "";

    if (selected.size === 0)
      return RECOGNITION_LANGUAGE_OPTIONS.filter((opt) => installed.includes(opt.value))
        .map((opt) => opt.label)
        .join(", ");

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
          <div class="text-xs text-muted-foreground truncate">{visionLanguagesText()}</div>

          <div
            class="grid transition-all duration-200 ease-out"
            style={{
              "grid-template-rows": isAutoLanguageSelected() ? "1fr" : "0fr",
              opacity: isAutoLanguageSelected() ? "1" : "0",
            }}
          >
            <div class="overflow-hidden">
              <div class="text-xs pr-8 text-muted-foreground border-t mt-2 pt-2">
                Snappit will use macOS built-in OCR for language recognition, which provides the
                best accuracy and speed for printed text.
              </div>
            </div>
          </div>
        </RadioGroupItemCard>

        <RadioGroupItemCard
          value="tesseract"
          header="Tesseract"
          class="flex flex-col bg-card rounded-lg shrink-0 p-3 mb-3"
          disabled={!installedLanguages().length}
        >
          <div class="text-xs text-muted-foreground truncate pr-6">
            <Show when={!installedLanguages().length}>
              <div class="flex gap-1 items-center">
                To use Tesseract, download at least one language <BiSolidError />
              </div>
            </Show>

            <Show when={installedLanguages().length}>
              {tesseractSelectedText() ?? "Not selected"}
            </Show>
          </div>

          <div
            class="grid transition-all duration-200 ease-out"
            style={{
              "grid-template-rows": tesseractLanguageSet().size > 0 ? "1fr" : "0fr",
              opacity: tesseractLanguageSet().size > 0 ? "1" : "0",
            }}
          >
            <div class="overflow-hidden">
              <div class="text-xs pr-8 text-muted-foreground border-t mt-2 pt-2">
                Tesseract provides better quality for handwritten text and a wider choice of
                languages.
              </div>
            </div>
          </div>
        </RadioGroupItemCard>

        <div class="flex flex-col min-h-0 -m-3 border-t pt-3 p-3 pb-0 overflow-y-auto [scrollbar-gutter:stable]">
          <div class="text-muted-foreground text-sm">Tesseract languages</div>
          <div class="">
            <TesseractLanguageList
              options={sortedOptions}
              installedLanguages={installedLanguages}
              downloading={downloading}
              selectedLanguages={tesseractLanguageSet}
              isSystemLanguage={isSystemLanguage}
              canDeleteLanguage={canDeleteLanguage}
              onToggle={toggleRecognitionLanguage}
              onDownload={handleDownload}
              onDelete={deleteLanguage}
            />
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}

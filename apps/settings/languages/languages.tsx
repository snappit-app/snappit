import { RecognitionLanguageAutoOption, RecognitionLanguageManualList } from "@/shared/ocr";

export function Languages() {
  return (
    <div class="h-full flex flex-col p-6">
      <div class="h-full flex flex-col border rounded-lg overflow-hidden">
        <div class="p-5 z-10">
          <h2 class="font-bold text-lg">Language selection</h2>
          <p class="text-sm text-muted-foreground">
            Choose the languages you want the app to search for
            <br />
            Selecting more languages may make the search a bit slower
          </p>
        </div>

        <div class="p-5 pb-0">
          <RecognitionLanguageAutoOption />
        </div>

        <div class="grow overflow-auto p-5 pt-1">
          <RecognitionLanguageManualList />
        </div>
      </div>
    </div>
  );
}

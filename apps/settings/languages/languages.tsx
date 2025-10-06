import { RecognitionLanguageSelector } from "@/shared/ocr";

export function Languages() {
  return (
    <div class="p-6">
      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">Language selection</h2>
          <p class="text-sm text-muted-foreground">
            Choose the languages you want the app to search for on text capture <br />
            Selecting more languages may make the search a bit slower
          </p>
        </div>

        <RecognitionLanguageSelector />
      </div>
    </div>
  );
}

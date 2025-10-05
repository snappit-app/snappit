import { createMemo, createSignal, For, Show } from "solid-js";

import {
  ShortcutPreferenceItem,
  TOOL_SHORTCUTS,
} from "@/apps/settings/shortcuts/shortcut-pref-item";
import { NotificationSettings } from "@/shared/notifications/settings";
import type { RecognitionLanguageValue } from "@/shared/ocr";
import { RECOGNITION_LANGUAGE_OPTIONS, RecognitionLanguage } from "@/shared/ocr";
import { Theme } from "@/shared/theme";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
  const [isRecognitionLanguageOpen, setRecognitionLanguageOpen] = createSignal(false);
  type RecognitionLanguageOption = (typeof RECOGNITION_LANGUAGE_OPTIONS)[number];
  const recognitionLanguageOptions =
    RECOGNITION_LANGUAGE_OPTIONS as unknown as RecognitionLanguageOption[];

  const selectedRecognitionLanguage = createMemo<RecognitionLanguageOption>(() => {
    const current = recognitionLanguageOptions.find(
      (option) => option.value === recognitionLanguage(),
    );
    return current ?? recognitionLanguageOptions[0];
  });

  const handleRecognitionLanguageChange = (option: RecognitionLanguageOption | null) => {
    const next = option?.value ?? recognitionLanguageOptions[0]?.value ?? "auto";
    setRecognitionLanguage(next as RecognitionLanguageValue);
  };

  return (
    <div class="p-6 flex flex-col gap-6">
      <div class="flex justify-between items-center">
        <div>Theme</div>
        <ToggleGroup size={"sm"} value={theme()}>
          <ToggleGroupItem onClick={() => setTheme("light")} value="light">
            Light
          </ToggleGroupItem>
          <ToggleGroupItem onClick={() => setTheme("dark")} value="dark">
            Dark
          </ToggleGroupItem>

          <ToggleGroupItem onClick={() => setTheme("system")} value="system">
            System
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Switch class="flex justify-between">
        <SwitchLabel>Sound</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <Switch
        class="flex justify-between"
        checked={notificationsEnabled()}
        onChange={setNotificationsEnabled}
      >
        <SwitchLabel>Notifications</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <Accordion
        class="border rounded-lg"
        collapsible
        value={isRecognitionLanguageOpen() ? ["recognition-language"] : []}
        onChange={(value) => setRecognitionLanguageOpen(value.includes("recognition-language"))}
      >
        <AccordionItem value="recognition-language" class="border-none">
          <AccordionTrigger class="px-4 py-3 text-left">
            <span class="flex flex-1 items-center justify-between gap-4">
              <span>Recognition Language</span>
              <span class="text-sm text-muted-foreground">
                {selectedRecognitionLanguage().label}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent class="px-4">
            <div class="flex flex-col gap-2">
              <For each={recognitionLanguageOptions}>
                {(option) => (
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    classList={{
                      "bg-muted": option.value === recognitionLanguage(),
                      "font-medium": option.value === recognitionLanguage(),
                    }}
                    onClick={() => {
                      handleRecognitionLanguageChange(option);
                      setRecognitionLanguageOpen(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <Show when={option.value === recognitionLanguage()}>
                      <span class="text-xs text-muted-foreground">Selected</span>
                    </Show>
                  </button>
                )}
              </For>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">Tool Shortcuts</h2>
          <p class="text-sm text-muted-foreground">
            Set dedicated shortcuts for each TextSnap tool.
          </p>
        </div>
        <div class="divide-y">
          <For each={TOOL_SHORTCUTS}>{(item) => <ShortcutPreferenceItem {...item} />}</For>
        </div>
      </div>
    </div>
  );
}

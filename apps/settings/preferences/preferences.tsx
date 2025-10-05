import { createMemo, createSignal, For, Show } from "solid-js";

import {
  ShortcutPreferenceItem,
  TOOL_SHORTCUTS,
} from "@/apps/settings/shortcuts/shortcut-pref-item";
import { cn } from "@/shared/libs/cn";
import { NotificationSettings } from "@/shared/notifications/settings";
import {
  RECOGNITION_LANGUAGE_OPTIONS,
  RecognitionLanguage,
  RecognitionLanguageValue,
} from "@/shared/ocr";
import { Theme } from "@/shared/theme";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { Checkbox, CheckboxControl, CheckboxLabel } from "@/shared/ui/checkbox";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
  const [isRecognitionLanguageOpen, setRecognitionLanguageOpen] = createSignal(false);

  const autoOption = RECOGNITION_LANGUAGE_OPTIONS.find((option) => option.value === "auto");
  const manualRecognitionOptions = RECOGNITION_LANGUAGE_OPTIONS.filter(
    (option) => option.value !== "auto",
  );
  const manualRecognitionOptionValues = manualRecognitionOptions.map((option) => option.value);

  const selectedManualLanguageCodes = createMemo<RecognitionLanguageValue[]>(() => {
    const current = recognitionLanguage();
    if (!current || current === "auto") return [];

    const parts = current
      .split("+")
      .map((code) => code.trim())
      .filter(Boolean);
    return manualRecognitionOptionValues.filter((code) => parts.includes(code));
  });

  const selectedManualLanguageSet = createMemo(() => new Set(selectedManualLanguageCodes()));

  const isAutoLanguageSelected = createMemo(() => {
    const current = recognitionLanguage();
    return !current || current === "auto" || selectedManualLanguageCodes().length === 0;
  });

  const selectedRecognitionLanguageLabel = createMemo(() => {
    if (isAutoLanguageSelected()) {
      return autoOption?.label ?? "Auto";
    }

    const labels = manualRecognitionOptions
      .filter((option) => selectedManualLanguageSet().has(option.value))
      .map((option) => option.label);

    if (labels.length === 0) {
      return autoOption?.label ?? "Auto";
    }

    return labels.join(", ");
  });

  const toggleRecognitionLanguage = (value: RecognitionLanguageValue) => {
    const current = new Set(selectedManualLanguageCodes());

    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }

    if (current.size === 0) {
      setRecognitionLanguage("auto");
      return;
    }

    const ordered = manualRecognitionOptionValues.filter((code) => current.has(code));
    setRecognitionLanguage(ordered.join("+") as RecognitionLanguageValue);
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
        <SwitchLabel>Startup</SwitchLabel>
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
            <span class="flex flex-1 justify-between gap-4">
              <span class="whitespace-nowrap">Capture Language</span>
              <span class="text-sm text-muted-foreground">
                {selectedRecognitionLanguageLabel()}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent class="px-4">
            <div class="flex flex-col gap-2">
              <For each={RECOGNITION_LANGUAGE_OPTIONS}>
                {(option) => {
                  const handleCheck = () => {
                    toggleRecognitionLanguage(option.value);
                  };

                  return (
                    <>
                      <Show when={option.value === "auto"}>
                        <button
                          type="button"
                          class={cn(
                            "flex w-full cursor-pointer items-center justify-between rounded-md p-2 text-left text-sm hover:bg-muted",
                            isAutoLanguageSelected() ? "bg-muted" : "",
                          )}
                          aria-pressed={isAutoLanguageSelected()}
                          onClick={() => setRecognitionLanguage("auto")}
                        >
                          <span>{option.label}</span>
                        </button>
                        <div class="border-t border-gray-300 my-1" />
                      </Show>

                      <Show when={option.value !== "auto"}>
                        <Checkbox
                          class="flex items-center w-full relative"
                          checked={selectedManualLanguageSet().has(option.value)}
                          onChange={handleCheck}
                        >
                          <CheckboxLabel
                            class={cn(
                              "text-sm grow-1 cursor-pointer rounded-md font-medium leading-none p-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 hover:bg-muted",
                              selectedManualLanguageSet().has(option.value) ? "bg-muted" : "",
                            )}
                          >
                            {option.label}
                          </CheckboxLabel>
                          <CheckboxControl class="absolute right-2" />
                        </Checkbox>
                      </Show>
                    </>
                  );
                }}
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

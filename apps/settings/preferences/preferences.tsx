import type { SelectRootItemComponentProps } from "@kobalte/core/select";
import { createMemo, For } from "solid-js";

import {
  ShortcutPreferenceItem,
  TOOL_SHORTCUTS,
} from "@/apps/settings/shortcuts/shortcut-pref-item";
import { NotificationSettings } from "@/shared/notifications/settings";
import type { RecognitionLanguageValue } from "@/shared/ocr";
import { RECOGNITION_LANGUAGE_OPTIONS, RecognitionLanguage } from "@/shared/ocr";
import { Theme } from "@/shared/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [recognitionLanguage, setRecognitionLanguage] = RecognitionLanguage.create();
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

  const renderLanguageOption = (props: SelectRootItemComponentProps<RecognitionLanguageOption>) => {
    const option = props.item.rawValue;
    return <SelectItem item={props.item}>{option.label}</SelectItem>;
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

      <div class="flex justify-between items-center gap-4">
        <div>Recognition Language</div>
        <Select
          value={selectedRecognitionLanguage()}
          onChange={handleRecognitionLanguageChange}
          options={recognitionLanguageOptions}
          optionValue="value"
          optionTextValue="label"
          placeholder={<span>Auto</span>}
          itemComponent={renderLanguageOption}
        >
          <SelectTrigger class="w-52">
            <SelectValue<RecognitionLanguageOption>>
              {(state) => state.selectedOption()?.label ?? "Auto"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

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

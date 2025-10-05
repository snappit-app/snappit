import { For } from "solid-js";

import {
  ShortcutPreferenceItem,
  TOOL_SHORTCUTS,
} from "@/apps/settings/shortcuts/shortcut-pref-item";
import { NotificationSettings } from "@/shared/notifications/settings";
import { Theme } from "@/shared/theme";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();

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

      <div class="flex justify-between">
        <div>Recognition Language</div>
        <div>true</div>
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

import { onMount } from "solid-js";

import { AutostartSettings } from "@/shared/autostart";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import {
  COLOR_FORMAT_OPTIONS,
  ColorFormat,
  DEFAULT_COLOR_FORMAT,
} from "@/shared/libs/color_format";
import { NotificationSettings } from "@/shared/notifications/settings";
import { SnappitStore } from "@/shared/store";
import { Theme } from "@/shared/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [autostartEnabled, setAutostartEnabled, autostartReady] = AutostartSettings.create();
  const [toolsEnabled, setToolsEnabled] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.tools_panel,
  );
  const [colorFormat, setColorFormat] = SnappitStore.createValue<ColorFormat>(
    SNAPPIT_CONSTS.store.keys.preferred_color_format,
  );

  onMount(async () => {
    SnappitStore.sync();
  });

  return (
    <div class="p-6">
      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">Preferences</h2>
          <p class="text-sm text-muted-foreground">
            Manage app appearance, launch settings, and notifications
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <div class="text-sm">Theme</div>
            <ToggleGroup size={"sm"} color={"product"} value={theme()}>
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

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={autostartEnabled()}
            onChange={setAutostartEnabled}
            disabled={!autostartReady()}
          >
            <SwitchLabel class="text-sm">Startup</SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={notificationsEnabled()}
            onChange={(e) => setNotificationsEnabled(e)}
          >
            <SwitchLabel class="text-sm">Notifications</SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={!!toolsEnabled()}
            onChange={(value) => setToolsEnabled(value)}
          >
            <SwitchLabel class="text-sm">Tools panel</SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <div class="flex justify-between items-center h-[30px]">
            <div class="text-sm">Color format</div>
            <Select
              value={colorFormat() ?? DEFAULT_COLOR_FORMAT}
              onChange={(value) => value && setColorFormat(value)}
              options={COLOR_FORMAT_OPTIONS.map((o) => o.value)}
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  {COLOR_FORMAT_OPTIONS.find((o) => o.value === props.item.rawValue)?.label}
                </SelectItem>
              )}
            >
              <SelectTrigger class="w-[100px]">
                <SelectValue<ColorFormat>>
                  {(state) =>
                    COLOR_FORMAT_OPTIONS.find((o) => o.value === state.selectedOption())?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

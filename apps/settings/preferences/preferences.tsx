import { AutostartSettings } from "@/shared/autostart";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import { NotificationSettings } from "@/shared/notifications/settings";
import { SnappitStore } from "@/shared/store";
import { Theme } from "@/shared/theme";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [autostartEnabled, setAutostartEnabled, autostartReady] = AutostartSettings.create();
  const [toolsEnabled, setToolsEnabled] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.tools_panel,
  );

  return (
    <div class="p-6">
      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">Preferences</h2>
          <p class="text-sm text-muted-foreground">
            Manage app appearance, launch settings, and notifications
          </p>
        </div>

        <div class="flex flex-col gap-6">
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

          <Switch
            class="flex justify-between"
            checked={autostartEnabled()}
            onChange={setAutostartEnabled}
            disabled={!autostartReady()}
          >
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

          <Switch
            class="flex justify-between"
            checked={!!toolsEnabled()}
            onChange={(value) => setToolsEnabled(value)}
          >
            <SwitchLabel>Tools panel</SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </div>
      </div>
    </div>
  );
}

import { Theme } from "@/shared/theme";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();

  return (
    <div class="p-6">
      <div class="flex justify-between mb-4">
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

      <Switch class="flex justify-between mb-4">
        <SwitchLabel>Sound</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <Switch class="flex justify-between mb-4">
        <SwitchLabel>Notifications</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>

      <div class="flex justify-between">
        <div>Recognition Language</div>
        <div>true</div>
      </div>
    </div>
  );
}

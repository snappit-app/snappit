import {
  BiRegularLinkExternal,
  BiRegularSun,
  BiRegularText,
  BiRegularTimer,
  BiSolidBell,
  BiSolidDockBottom,
  BiSolidNotification,
  BiSolidPalette,
  BiSolidUser,
} from "solid-icons/bi";
import { createMemo, onMount, Show } from "solid-js";

import { AutostartSettings } from "@/shared/autostart";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import {
  COLOR_FORMAT_OPTIONS,
  ColorFormat,
  DEFAULT_COLOR_FORMAT,
} from "@/shared/libs/color_format";
import {
  DEFAULT_NOTIFICATION_DURATION,
  NOTIFICATION_DURATION_OPTIONS,
  NotificationDuration,
  NotificationDurationSettings,
} from "@/shared/notifications";
import { NotificationSettings } from "@/shared/notifications";
import { SnappitStore } from "@/shared/store";
import { Theme } from "@/shared/theme";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";

export function Preferences() {
  const [theme, setTheme] = Theme.create();
  const [notificationsEnabled, setNotificationsEnabled] = NotificationSettings.create();
  const [notificationDuration, setNotificationDuration] = NotificationDurationSettings.create();
  const [autostartEnabled, setAutostartEnabled, autostartReady] = AutostartSettings.create();
  const [toolsEnabled, setToolsEnabled, , toolsReady] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.tools_panel,
  );
  const [colorFormat, setColorFormat, , colorFormatReady] = SnappitStore.createValue<ColorFormat>(
    SNAPPIT_CONSTS.store.keys.preferred_color_format,
  );
  const [soundEnabled, setSoundEnabled, , soundReady] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.sound_enabled,
  );
  const [ocrKeepLineBreaks, setOcrKeepLineBreaks, , ocrReady] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.ocr_keep_line_breaks,
  );
  const [qrAutoOpenUrls, setQrAutoOpenUrls, , qrReady] = SnappitStore.createValue<boolean>(
    SNAPPIT_CONSTS.store.keys.qr_auto_open_urls,
  );

  const isReady = createMemo(
    () => toolsReady() && colorFormatReady() && soundReady() && ocrReady() && qrReady(),
  );

  onMount(async () => {
    SnappitStore.sync();
  });

  return (
    <Show when={isReady()}>
      <div class="p-3">
        <h2 class="text-center text-bold mb-3 font-bold text-xl">Preferences</h2>

        <div class="rounded-lg p-3 bg-card mb-3">
          <div class="flex justify-between items-center">
            <div class="text-sm font-light flex gap-2 items-center">
              <BiRegularSun />
              Theme
            </div>
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
        </div>

        <div class="rounded-lg p-3 bg-card mb-3">
          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={autostartEnabled()}
            onChange={setAutostartEnabled}
            disabled={!autostartReady()}
          >
            <SwitchLabel class="text-sm font-light  flex gap-2 items-center">
              <BiSolidUser />
              Launch at startup
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={soundEnabled() ?? true}
            onChange={(value) => setSoundEnabled(value)}
          >
            <SwitchLabel class="text-sm font-light flex gap-2 items-center">
              <BiSolidBell />
              Sounds
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={ocrKeepLineBreaks() ?? true}
            onChange={(value) => setOcrKeepLineBreaks(value)}
          >
            <SwitchLabel class="text-sm font-light flex gap-2 items-center">
              <BiRegularText />
              Keep line breaks
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={!!toolsEnabled()}
            onChange={(value) => setToolsEnabled(value)}
          >
            <SwitchLabel class="text-sm font-light flex gap-2 items-center">
              <BiSolidDockBottom /> Tools panel
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={qrAutoOpenUrls() ?? false}
            onChange={(value) => setQrAutoOpenUrls(value)}
          >
            <SwitchLabel class="text-sm font-light flex gap-2 items-center">
              <BiRegularLinkExternal />
              Auto-open QR URLs
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </div>

        <div class="rounded-lg p-3 bg-card mb-3">
          <Switch
            class="flex justify-between items-center h-[30px]"
            checked={notificationsEnabled()}
            onChange={(e) => setNotificationsEnabled(e)}
          >
            <SwitchLabel class="text-sm font-light flex gap-2 items-center">
              <BiSolidNotification />
              Notifications
            </SwitchLabel>
            <SwitchControl variant={"product"}>
              <SwitchThumb />
            </SwitchControl>
          </Switch>

          <div
            class="grid transition-all duration-200 ease-out"
            style={{
              "grid-template-rows": notificationsEnabled() ? "1fr" : "0fr",
              opacity: notificationsEnabled() ? "1" : "0",
            }}
          >
            <div class="overflow-hidden">
              <div class="flex justify-between items-center h-[30px]">
                <div class="text-sm font-light flex gap-2 items-center">
                  <BiRegularTimer /> Duration
                </div>
                <Select
                  value={notificationDuration() ?? DEFAULT_NOTIFICATION_DURATION}
                  onChange={(value) => value && setNotificationDuration(value)}
                  options={NOTIFICATION_DURATION_OPTIONS.map((o) => o.value)}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {
                        NOTIFICATION_DURATION_OPTIONS.find((o) => o.value === props.item.rawValue)
                          ?.label
                      }
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-[130px]">
                    <SelectValue<NotificationDuration>>
                      {(state) =>
                        NOTIFICATION_DURATION_OPTIONS.find(
                          (o) => o.value === state.selectedOption(),
                        )?.label
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg p-3 bg-card mb-3">
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center h-[30px]">
              <div class="text-sm font-light flex gap-2 items-center">
                <BiSolidPalette /> Color format
              </div>
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
                <SelectTrigger class="w-[130px]">
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
    </Show>
  );
}

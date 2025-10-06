import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createEffect, createMemo, Show } from "solid-js";

import {
  COLOR_DROPPER_SHORTCUT_KEY,
  DIGITAL_RULER_SHORTCUT_KEY,
  QR_SHORTCUT_KEY,
  SMART_SHORTCUT_KEY,
  TEXT_CAPTURE_SHORTCUT_KEY,
} from "@/apps/settings/shortcuts/consts";
import { createPermissions } from "@/shared/libs/permissions";
import { createSettingsVisible } from "@/shared/libs/settings_visible";
import { Theme } from "@/shared/theme";

import { General } from "./general";
import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

function SettingsApp() {
  Theme.create();
  const [visible] = createSettingsVisible();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);

  SnapOverlayApi.createShortcut(SMART_SHORTCUT_KEY, "smart_tool");
  SnapOverlayApi.createShortcut(TEXT_CAPTURE_SHORTCUT_KEY, "text_capture");
  SnapOverlayApi.createShortcut(DIGITAL_RULER_SHORTCUT_KEY, "digital_ruler");
  SnapOverlayApi.createShortcut(COLOR_DROPPER_SHORTCUT_KEY, "color_dropper");
  SnapOverlayApi.createShortcut(QR_SHORTCUT_KEY, "qr_scanner");

  return (
    <main class="h-full">
      <Show when={permissions.loading()}>
        <p class="text-sm text-muted-foreground">Checking permissions…</p>
      </Show>
      <Show
        when={!permissions.loading() && permissionsGranted() && visible()}
        fallback={<PermissionsGate />}
      >
        <Tabs defaultValue="account" class="h-full flex flex-col">
          <header class="p-3 border-b-1">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
          </header>

          <div class="grow-1 overflow-auto">
            <TabsContent class="h-full" value="general">
              <General />
            </TabsContent>
            <TabsContent value="preferences">
              <Preferences />
            </TabsContent>
            <TabsContent value="about">Change your password here.</TabsContent>
          </div>
        </Tabs>
      </Show>
    </main>
  );
}

export default SettingsApp;

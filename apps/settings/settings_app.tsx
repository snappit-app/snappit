import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createMemo, Show } from "solid-js";

import { Languages } from "@/apps/settings/languages";
import { Shortcuts } from "@/apps/settings/shortcuts";
import { createPermissions } from "@/shared/libs/permissions";
import { createSettingsVisible } from "@/shared/libs/settings_visible";
import { Theme } from "@/shared/theme";

import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

function SettingsApp() {
  Theme.create();
  const [visible] = createSettingsVisible();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);

  return (
    <main class="h-full">
      <Show when={permissions.loading()}>
        <p class="text-sm text-muted-foreground">Checking permissions…</p>
      </Show>
      <Show when={!permissions.loading() && !permissionsGranted()}>
        <PermissionsGate />
      </Show>
      <Show when={!permissions.loading() && permissionsGranted() && visible()}>
        <Tabs defaultValue="account" class="h-full flex flex-col">
          <header class="p-3 border-b-1">
            <TabsList>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>
          </header>

          <div class="grow-1 overflow-auto">
            <TabsContent value="preferences">
              <Preferences />
            </TabsContent>
            <TabsContent value="shortcuts">
              <Shortcuts />
            </TabsContent>
            <TabsContent value="languages">
              <Languages />
            </TabsContent>
          </div>
        </Tabs>
      </Show>
    </main>
  );
}

export default SettingsApp;

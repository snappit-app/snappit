import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createMemo, Show } from "solid-js";

import { Languages } from "@/apps/settings/languages";
import { Shortcuts } from "@/apps/settings/shortcuts";
import { createPermissions } from "@/shared/libs/permissions";
import { createSettingsVisible } from "@/shared/libs/settings_visible";
import { Theme } from "@/shared/theme";

import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

import { ensureSystemLanguagesInstalled, isInitialSetup } from "@/shared/ocr/installed_languages";
import { onMount } from "solid-js";

function SettingsApp() {
  Theme.create();
  const [visible] = createSettingsVisible();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);

  onMount(() => {
    ensureSystemLanguagesInstalled();
  });

  return (
    <main class="h-full relative">
      <Show when={isInitialSetup()}>
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p class="text-sm font-medium">Initial setup in progress...</p>
        </div>
      </Show>
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createMemo, Show } from "solid-js";
import { onMount } from "solid-js";

import { Languages } from "@/apps/settings/languages";
import { License } from "@/apps/settings/license";
import { Shortcuts } from "@/apps/settings/shortcuts";
import { createPermissions } from "@/shared/libs/permissions";
import { createSettingsVisible } from "@/shared/libs/settings_visible";
import { ensureSystemLanguagesInstalled, isInitialSetup } from "@/shared/ocr/installed_languages";
import { Theme } from "@/shared/theme";

import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

function SettingsApp() {
  Theme.create();
  const [visible] = createSettingsVisible();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);
  const canLoadApp = createMemo(() => !permissions.loading() && permissionsGranted() && visible());

  onMount(() => {
    ensureSystemLanguagesInstalled();
  });

  return (
    <>
      <Tabs class="h-screen flex flex-col overflow-hidden" defaultValue="preferences">
        <header data-tauri-drag-region class="border-b b-1 bg-sidebar">
          <div
            data-tauri-drag-region
            class="flex justify-center items-center h-[32px] relative font-bold cursor-default"
          >
            <div class="absolute flex left-[9px] top-[9px] gap-[9px]">
              <div class="w-[14px] h-[14px] rounded-lg bg-tansparent" />
              <div class="w-[14px] h-[14px] rounded-lg bg-tansparent" />
              <div class="w-[14px] h-[14px] rounded-lg bg-tansparent" />
            </div>
            Snappit
          </div>
          <Show when={canLoadApp()}>
            <div data-tauri-drag-region class="px-6 py-4">
              <TabsList>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
              </TabsList>
            </div>
          </Show>
        </header>
        <main class="relative grow-1 min-h-0">
          <Show when={isInitialSetup()}>
            <div class="h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p class="text-sm font-medium">Initial setup in progress...</p>
            </div>
          </Show>
          <Show when={permissions.loading()}>
            <div class="h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
              <p class="text-sm font-medium">Checking permissions…</p>
            </div>
          </Show>
          <Show when={!permissions.loading() && !permissionsGranted()}>
            <PermissionsGate />
          </Show>
          <Show when={canLoadApp()}>
            <TabsContent value="preferences" class="h-full overflow-auto">
              <Preferences />
            </TabsContent>
            <TabsContent value="shortcuts" class="h-full overflow-auto">
              <Shortcuts />
            </TabsContent>
            <TabsContent value="languages" class="h-full flex flex-col overflow-hidden">
              <Languages />
            </TabsContent>
            <TabsContent value="license" class="h-full overflow-auto">
              <License />
            </TabsContent>
          </Show>
        </main>
      </Tabs>
    </>
  );
}

export default SettingsApp;

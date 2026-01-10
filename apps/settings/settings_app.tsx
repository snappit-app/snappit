import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { UnlistenFn } from "@tauri-apps/api/event";
import { BiRegularCommand, BiRegularGlobe, BiSolidCog, BiSolidShield } from "solid-icons/bi";
import { createMemo, createSignal, Show } from "solid-js";
import { onCleanup, onMount } from "solid-js";

import { Languages } from "@/apps/settings/languages";
import { License } from "@/apps/settings/license";
import { Shortcuts } from "@/apps/settings/shortcuts";
import { SnappitLicense } from "@/shared/libs/license";
import { createPermissions } from "@/shared/libs/permissions";
import { createSettingsVisible } from "@/shared/libs/settings_visible";
import { ensureSystemLanguagesInstalled, isInitialSetup } from "@/shared/ocr/installed_languages";
import { SettingsApi } from "@/shared/tauri/settings_api";
import { Theme } from "@/shared/theme";
import { TrialBadge } from "@/shared/ui/trial_badge";

import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

function SettingsApp() {
  Theme.create();
  const [visible] = createSettingsVisible();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);
  const canLoadApp = createMemo(() => !permissions.loading() && permissionsGranted() && visible());
  const [licenseState, refetch] = SnappitLicense.create();
  const [activeTab, setActiveTab] = createSignal("preferences");
  const isTrial = createMemo(() => licenseState()?.licenseType === "trial");
  let unlistenOpenTab: UnlistenFn | undefined;

  refetch();

  onMount(async () => {
    ensureSystemLanguagesInstalled();

    unlistenOpenTab = await SettingsApi.onOpenTab((event) => {
      if (event.payload) {
        setActiveTab(event.payload);
      }
    });
  });

  onCleanup(() => {
    unlistenOpenTab?.();
  });

  return (
    <Tabs
      orientation="vertical"
      class="flex relateive overflow-hidden h-screen"
      value={activeTab()}
      onChange={setActiveTab}
    >
      <header
        data-tauri-drag-region
        class="h-[56px] w-full absolute left-0 top-0 z-55 flex items-center justify-end pr-3  cursor-default select-none"
      />

      <aside class="w-[200px] h-full px-2 pb-7 pt-[56px] flex flex-col justify-between">
        <Show when={canLoadApp()} fallback={<div />}>
          <TabsList>
            <TabsTrigger value="preferences">
              <BiSolidCog /> Preferences
            </TabsTrigger>
            <TabsTrigger value="shortcuts">
              <BiRegularCommand /> Shortcuts
            </TabsTrigger>
            <TabsTrigger value="languages">
              <BiRegularGlobe /> Languages
            </TabsTrigger>
            <TabsTrigger value="license">
              <BiSolidShield />
              License
            </TabsTrigger>
          </TabsList>
        </Show>

        <div class="flex flex-col items-center justify-center gap-4">
          <img src="/favicon.png" alt="Snappit Logo" class=" w-[32px] h-[32px]" />
          <span class="text-xs">Snappit</span>
        </div>
      </aside>
      <main class="relative grow-1 min-h-0 p-4 pt-[56px] bg-background">
        <Show when={isTrial()}>
          <div class="fixed right-[16px] top-[11px]">
            <TrialBadge />
          </div>
        </Show>
        <Show when={isInitialSetup()}>
          <div class="h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div class="animate-spin h-8 w-8 border-4 border-prima ary border-t-transparent rounded-full mb-4" />
            <p class="text-sm font-medium">Initial setup in progress...</p>
          </div>
        </Show>
        <Show when={permissions.loading()}>
          <div class="h-full flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div class="animate-spin h-8 w-8 border-4 border-prima ary border-t-transparent rounded-full mb-4" />
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
  );
}

export default SettingsApp;

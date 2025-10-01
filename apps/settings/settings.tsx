import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createEffect, createMemo, onCleanup, Show } from "solid-js";

import { createPermissions } from "@/shared/libs/permissions";
import { TextSnapTrayApi } from "@/shared/tauri/snap_tray_api";
import { Theme } from "@/shared/theme";

import { General } from "./general";
import { PermissionsGate } from "./permissions";
import { Preferences } from "./preferences";

function Settings() {
  Theme.create();
  const permissions = createPermissions();
  const permissionsGranted = createMemo(() => permissions.state()?.screenRecording ?? false);
  const [storeShortcut] = SnapOverlayApi.createShortcut();

  createEffect<string | undefined>((prev) => {
    const curr = storeShortcut();

    if (prev && prev !== curr) {
      SnapOverlayApi.unregisterShowShortcut(prev);
    }

    SnapOverlayApi.registerShowShortcut(curr);
    TextSnapTrayApi.updateCaptureShortcut();
    return curr;
  });

  onCleanup(() => {
    const curr = storeShortcut();
    if (curr) {
      SnapOverlayApi.unregisterShowShortcut(curr);
    }
  });

  return (
    <main class="">
      <Show when={permissions.loading()}>
        <p class="text-sm text-muted-foreground">Checking permissions…</p>
      </Show>
      <Show when={!permissions.loading() && permissionsGranted()} fallback={<PermissionsGate />}>
        <Tabs defaultValue="account" class="h-full flex flex-col">
          <header class="p-3 border-b-1">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
          </header>

          <div class="grow-1">
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

export default Settings;

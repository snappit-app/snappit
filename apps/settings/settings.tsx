import { General } from "@settings/general";
import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { createEffect, onCleanup } from "solid-js";

import { Preferences } from "@/apps/settings/preferences";
import { TextSnapTrayApi } from "@/shared/tauri/snap_tray_api";
import { Theme } from "@/shared/theme";

function Settings() {
  Theme.create();
  const [storeShortcut] = SnapOverlayApi.createShortcut();

  createEffect<string>((prev) => {
    const curr = storeShortcut();

    if (prev) {
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
    <main class="h-full">
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
    </main>
  );
}

export default Settings;

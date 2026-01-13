import { BiSolidCheckCircle, BiSolidCloudDownload } from "solid-icons/bi";
import { Show } from "solid-js";

import { useAutoUpdate } from "@/shared/auto-update";
import { createVersion } from "@/shared/libs/version";
import { Button } from "@/shared/ui/button";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@/shared/ui/switch";
import { Tag } from "@/shared/ui/tag";

export function About() {
  const version = createVersion();
  const {
    checkForUpdates,
    downloadUpdate,
    restartApp,
    status,
    error,
    updateInfo,
    downloadProgress,
    autoUpdatesEnabled,
    setAutoUpdatesEnabled,
  } = useAutoUpdate();

  return (
    <>
      <h2 class="text-center text-bold mb-3 font-bold text-xl">About</h2>

      <div class="rounded-lg p-4 bg-card mb-3  flex gap-4 justify-between items-center">
        <div class="flex items-center gap-3">
          <img src="/favicon.png" alt="Snappit Logo" class="w-6 h-6" />
          <div>
            <h3 class="font-semibold text-sm">Snappit</h3>
            <p class="text-xs text-muted-foreground">Version {version()}</p>
          </div>
        </div>

        <Show when={status() === "idle"}>
          <Button onClick={checkForUpdates} size="sm" variant={"muted"}>
            Check for Updates
          </Button>
        </Show>

        <Show when={status() === "checking"}>
          <div class="flex items-center justify-center gap-2 py-2">
            <div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span class="text-xs text-muted-foreground">Checking for updates...</span>
          </div>
        </Show>

        <Show when={status() === "up-to-date"}>
          <div class="flex items-center gap-2 ">
            <button onClick={checkForUpdates}>
              <Tag>
                <BiSolidCheckCircle class="w-[12px] h-[12px]" />
                <span>You're up to date!</span>
              </Tag>
            </button>
          </div>
        </Show>
      </div>

      <div class="rounded-lg p-3 bg-card mb-3">
        <Switch
          class="flex justify-between items-center h-[30px]"
          checked={autoUpdatesEnabled() ?? false}
          onChange={(value) => setAutoUpdatesEnabled(value)}
        >
          <SwitchLabel class="text-sm font-light flex gap-2 items-center">
            <BiSolidCloudDownload />
            Auto updates
          </SwitchLabel>
          <SwitchControl variant={"product"}>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      {/* Update available state */}
      <Show when={status() === "available"}>
        <div class="space-y-3 p-3 bg-card rounded-lg">
          <div>
            <div class="flex justify-between items-center border-b pb-3 mb-3">
              <p class="font-medium text-sm">Update available: v{updateInfo()?.version}</p>
              <Button onClick={downloadUpdate} size={"sm"} variant="muted">
                Download Update
              </Button>
            </div>
            <Show when={updateInfo()?.body}>
              <p class="text-xs text-muted-foreground whitespace-pre-wrap">{updateInfo()?.body}</p>
            </Show>
          </div>
        </div>
      </Show>

      {/* Downloading state */}
      <Show when={status() === "downloading"}>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Downloading...</span>
            <span class="font-medium">{downloadProgress()}%</span>
          </div>
          <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all duration-300"
              style={{ width: `${downloadProgress()}%` }}
            />
          </div>
        </div>
      </Show>

      {/* Ready to restart state */}
      <Show when={status() === "ready"}>
        <div class="space-y-3 p-3 bg-success/10 rounded-lg text-center flex gap-4 justify-between items-center">
          <p class="text-success text-xs mb-0">Update is ready!</p>

          <Button onClick={restartApp} size={"sm"} variant="muted">
            Restart to Update
          </Button>
        </div>
      </Show>

      {/* Error state */}
      <Show when={status() === "error"}>
        <div class="space-y-2 p-3 bg-destructive/50 rounded-lg flex gap-4 justify-between items-center">
          <p class="text-xs text-destructive-foreground mb-0">{error()}</p>
          <div class="shrink-0">
            <Button onClick={checkForUpdates} size={"sm"} variant="muted">
              Try again
            </Button>
          </div>
        </div>
      </Show>
    </>
  );
}

import { relaunch } from "@tauri-apps/plugin-process";
import { check, Update } from "@tauri-apps/plugin-updater";
import { createSignal, Show } from "solid-js";

import { createVersion } from "@/shared/libs/version";
import { Button } from "@/shared/ui/button";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

export function About() {
  const version = createVersion();
  const [status, setStatus] = createSignal<UpdateStatus>("idle");
  const [error, setError] = createSignal<string>("");
  const [updateInfo, setUpdateInfo] = createSignal<Update | null>(null);
  const [downloadProgress, setDownloadProgress] = createSignal(0);

  async function checkForUpdates() {
    setStatus("checking");
    setError("");

    try {
      const update = await check();

      if (!update) {
        setStatus("up-to-date");
        return;
      }

      setUpdateInfo(update);
      setStatus("available");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check for updates");
      setStatus("error");
    }
  }

  async function downloadUpdate() {
    const update = updateInfo();
    if (!update) return;

    setStatus("downloading");
    setDownloadProgress(0);

    try {
      let totalSize = 0;
      let downloadedSize = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloadedSize += event.data.chunkLength;
            if (totalSize > 0) {
              setDownloadProgress(Math.round((downloadedSize / totalSize) * 100));
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download update");
      setStatus("error");
    }
  }

  async function restartApp() {
    await relaunch();
  }

  return (
    <>
      <h2 class="text-center text-bold mb-3 font-bold text-xl">About</h2>

      <div class="rounded-3xl p-4 bg-card mb-3">
        <div class="flex items-center gap-3">
          <img src="/favicon.png" alt="Snappit Logo" class="w-16 h-16" />
          <div>
            <h3 class="font-semibold text-lg">Snappit</h3>
            <p class="text-sm text-muted-foreground">Version {version()}</p>
          </div>
        </div>
      </div>

      {/* Idle state */}
      <Show when={status() === "idle"}>
        <button
          onClick={checkForUpdates}
          class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Check for Updates
        </button>
      </Show>

      {/* Checking state */}
      <Show when={status() === "checking"}>
        <div class="flex items-center justify-center gap-2 py-2">
          <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span class="text-sm text-muted-foreground">Checking for updates...</span>
        </div>
      </Show>

      {/* Up to date state */}
      <Show when={status() === "up-to-date"}>
        <div class="rounded-lg p-4 bg-card mb-3">
          <div class="text-center py-2">
            <p class="text-sm text-product mb-2">Everything is up-to-date</p>
            <Button onClick={() => setStatus("idle")} variant={"default"}>
              Check again
            </Button>
          </div>
        </div>
      </Show>

      {/* Update available state */}
      <Show when={status() === "available"}>
        <div class="space-y-3 p-3 bg-card rounded-lg">
          <div>
            <p class="font-medium text-sm">Update available: v{updateInfo()?.version}</p>
            <Show when={updateInfo()?.body}>
              <p class="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                {updateInfo()?.body}
              </p>
            </Show>
          </div>
          <Button variant={"default"} onClick={downloadUpdate} class="w-full">
            Download Update
          </Button>
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
        <div class="space-y-3 p-3 bg-success/10 rounded-lg text-center">
          <p class="text-sm text-success-foreground">Update downloaded successfully!</p>
          <Button onClick={restartApp} variant="success">
            Restart to Update
          </Button>
        </div>
      </Show>

      {/* Error state */}
      <Show when={status() === "error"}>
        <div class="space-y-2 p-3 bg-destructive/10 rounded-lg">
          <p class="text-sm text-destructive-foreground">{error()}</p>
          <button
            onClick={checkForUpdates}
            class="text-sm text-destructive-foreground hover:text-destructive-foreground/80 transition-colors"
          >
            Try again
          </button>
        </div>
      </Show>
    </>
  );
}

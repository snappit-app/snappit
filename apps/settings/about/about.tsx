import { makeTimer } from "@solid-primitives/timer";
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
  const [countdown, setCountdown] = createSignal(5);

  function startCountdown() {
    setCountdown(5);
    const clear = makeTimer(
      () => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clear();
            setStatus("idle");
            return 5;
          }
          return prev - 1;
        });
      },
      1000,
      setInterval,
    );
  }

  async function checkForUpdates() {
    setStatus("checking");
    setError("");

    try {
      const update = await check();

      if (!update) {
        setStatus("up-to-date");
        startCountdown();
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
          <div class="flex items-center gap-2 py-2">
            <span class="text-xs text-foreground">You're up-to-date!</span>
            <span class="text-xs text-muted-foreground">{countdown()}</span>
          </div>
        </Show>
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
          <p class="text-success text-xs mb-0">Update downloaded successfully!</p>

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

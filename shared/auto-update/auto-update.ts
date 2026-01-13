import { AutoUpdateApi } from "@shared/tauri/auto_update_api";
import { makeTimer } from "@solid-primitives/timer";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, Update } from "@tauri-apps/plugin-updater";
import { createEffect, createRoot, createSignal, on, onCleanup, Resource } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

// Check for updates every 4 hours (industry standard for desktop apps)
const AUTO_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

interface AutoUpdateState {
  status: () => UpdateStatus;
  error: () => string;
  updateInfo: () => Update | null;
  downloadProgress: () => number;
  autoUpdatesEnabled: Resource<boolean | null>;
  setAutoUpdatesEnabled: (value: boolean) => Promise<void>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  restartApp: () => Promise<void>;
}

let singleton: { state: AutoUpdateState; dispose: () => void } | null = null;

export function useAutoUpdate(): AutoUpdateState {
  if (singleton) {
    return singleton.state;
  }

  const instance = createRoot((dispose) => {
    const [status, setStatus] = createSignal<UpdateStatus>("idle");
    const [error, setError] = createSignal<string>("");
    const [updateInfo, setUpdateInfo] = createSignal<Update | null>(null);
    const [downloadProgress, setDownloadProgress] = createSignal(0);

    const [autoUpdatesEnabled, setAutoUpdatesEnabled] = SnappitStore.createValue<boolean>(
      SNAPPIT_CONSTS.store.keys.auto_updates,
    );

    let autoCheckCleanup: (() => void) | null = null;

    async function checkForUpdates() {
      if (status() === "checking" || status() === "downloading") return;

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
        // Notify the Rust backend that update is ready
        await AutoUpdateApi.setUpdateReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to download update");
        setStatus("error");
      }
    }

    async function restartApp() {
      await relaunch();
    }

    function startAutoCheck() {
      if (autoCheckCleanup) return;

      checkForUpdates();

      autoCheckCleanup = makeTimer(
        () => {
          const currentStatus = status();
          if (currentStatus === "idle" || currentStatus === "up-to-date") {
            checkForUpdates();
          }
        },
        AUTO_CHECK_INTERVAL_MS,
        setInterval,
      );
    }

    function stopAutoCheck() {
      if (autoCheckCleanup) {
        autoCheckCleanup();
        autoCheckCleanup = null;
      }
    }

    createEffect(
      on([status, autoUpdatesEnabled], ([s, enabled]) => {
        if (s === "available" && enabled) {
          downloadUpdate();
        }
      }),
    );

    createEffect(
      on(autoUpdatesEnabled, (enabled) => {
        if (enabled) {
          startAutoCheck();
        } else {
          stopAutoCheck();
        }
      }),
    );

    onCleanup(() => {
      stopAutoCheck();
    });

    const state: AutoUpdateState = {
      status,
      error,
      updateInfo,
      downloadProgress,
      autoUpdatesEnabled,
      setAutoUpdatesEnabled,
      checkForUpdates,
      downloadUpdate,
      restartApp,
    };

    return { state, dispose };
  });

  singleton = instance;
  return instance.state;
}

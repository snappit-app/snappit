import { fromGlobalShortcut, toGlobalShortcut } from "@shared/libs/shortcut_recorder";
import createShortcutRecorder from "@shared/libs/shortcut_recorder/shortcut_recorder";
import { SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Button } from "@shared/ui/button";
import { KeyboardButton } from "@shared/ui/keyboard_button";
import { BsRecordFill } from "solid-icons/bs";
import { BsArrowCounterclockwise } from "solid-icons/bs";
import { createEffect, createMemo, For, Show } from "solid-js";

import { DEFAULT_SHORTCUTS, SMART_SHORTCUT_KEY } from "@/apps/settings/shortcuts/consts";
import { RecordTooltip } from "@/shared/libs/shortcut_recorder";
import { TextSnapTrayApi } from "@/shared/tauri/snap_tray_api";
export function General() {
  const [storeShortcut, setStoreShortcut] = SnapOverlayApi.createStoredShortcut(
    SMART_SHORTCUT_KEY,
    "smart_tool",
  );

  const { candidate, savedShortcut, isRecording, startRecording } = createShortcutRecorder({
    minModKeys: 1,
  });

  const buttons = createMemo<string[]>(() =>
    storeShortcut() ? fromGlobalShortcut(storeShortcut()) : [],
  );

  createEffect(() => {
    const latest = savedShortcut();
    if (!latest.length) return;

    void (async () => {
      const globalShortcut = toGlobalShortcut(latest);
      await setStoreShortcut(globalShortcut);
      await TextSnapTrayApi.updateShortcut("smart_tool");
    })();
  });

  return (
    <div class="h-full flex flex-col p-6">
      <div class="mb-6">
        <h1 class="font-bold text-3xl">Welcome to TextSnap</h1>
        <p class="">your personal screen assistant</p>
      </div>

      <div class="border p-6 rounded-lg">
        <div class="flex items-center gap-5 mb-3">
          <h2 class="font-bold text-lg">Snap shortcut</h2>
          <div class="flex gap-2" />
        </div>

        <div class="flex justify-between items-center mb-10">
          <div class="flex items-center gap-1">
            <For each={buttons()}>{(b) => <KeyboardButton key={b} />}</For>
          </div>
        </div>

        <div class="flex gap-4">
          <Button
            class="relative flex items-center gap-2"
            variant="ghost"
            onClick={() => startRecording()}
          >
            <BsRecordFill size={"25"} />
            Record
            <Show when={isRecording()}>
              <RecordTooltip candidate={candidate} />
            </Show>
          </Button>

          <Button
            class="relative flex items-center gap-2"
            variant="ghost"
            onClick={() => setStoreShortcut(DEFAULT_SHORTCUTS[SMART_SHORTCUT_KEY])}
          >
            <BsArrowCounterclockwise size={"25"} />
            Reset to default
          </Button>
        </div>
      </div>
    </div>
  );
}

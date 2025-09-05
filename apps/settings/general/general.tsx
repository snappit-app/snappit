import { RecordTooltip } from "@settings/general/record_tooltip";
import { fromGlobalShortcut, toGlobalShortcut } from "@shared/libs/shortcut_recorder";
import createShortcutRecorder from "@shared/libs/shortcut_recorder/shortcut_recorder";
import { SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT, SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Button } from "@shared/ui/button";
import { KeyboardButton } from "@shared/ui/keyboard_button";
import { BsRecordFill } from "solid-icons/bs";
import { BsArrowCounterclockwise } from "solid-icons/bs";
import { createEffect, createMemo, For, Show } from "solid-js";
export function General() {
  const [storeShortcut, setStoreShortcut] = SnapOverlayApi.createShortcut();

  const { candidate, savedShortcut, isRecording, startRecording } = createShortcutRecorder({
    minModKeys: 1,
  });

  const buttons = createMemo<string[]>(() =>
    storeShortcut() ? fromGlobalShortcut(storeShortcut()) : [],
  );

  createEffect(() => {
    if (savedShortcut().length) {
      const global = toGlobalShortcut(savedShortcut());
      setStoreShortcut(global);
    }
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
            Record new
            <Show when={isRecording()}>
              <RecordTooltip candidate={candidate} />
            </Show>
          </Button>

          <Button
            class="relative flex items-center gap-2"
            variant="ghost"
            onClick={() => setStoreShortcut(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT)}
          >
            <BsArrowCounterclockwise size={"25"} />
            Reset to default
          </Button>
        </div>
      </div>
    </div>
  );
}

import { fromGlobalShortcut, toGlobalShortcut } from "@shared/libs/shortcut_recorder";
import createShortcutRecorder from "@shared/libs/shortcut_recorder/shortcut_recorder";
import { SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT, SnapOverlayApi } from "@shared/tauri/snap_overlay_api";
import { Button } from "@shared/ui/button";
import { KeyboardButton } from "@shared/ui/keyboard_button";
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
    <div class="h-full flex flex-col">
      <div class="p-9 border-b-1">
        <h1 class="font-bold text-3xl">Welcome to TextSnap</h1>
        <p class="">your personal screen assistant</p>
      </div>

      <div class="p-9">
        <div class="flex items-center gap-5 mb-3">
          <h2 class="font-bold text-lg">Snap shortcut</h2>
          <div class="flex gap-2">
            <Button class="relative" size="sm" variant="muted" onClick={() => startRecording()}>
              Record
              <Show when={isRecording()}>
                <div
                  class="absolute left-1/2 -top-13 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow z-1 cursor-default before:content-[''] before:absolute
           before:-bottom-1 before:left-1/2 before:-translate-x-1/2
           before:w-3 before:h-3 before:bg-popover before:rotate-45 before:-z-1
           before:shadow"
                >
                  <div class="h-full w-full bg-popover text-popover-foreground z-1 p-3 rounded-lg">
                    <div class="text-sm mb-2 flex gap-1">
                      <For each={candidate()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
                      {!candidate().length && (
                        <div class="flex gap-3 items-center text-muted-foreground">
                          <span class="text-xs">e.g</span>
                          <div class="flex gap-1">
                            <KeyboardButton key={"Meta"} size={"sm"} />
                            <KeyboardButton key={"Shift"} size={"sm"} />
                            <KeyboardButton key={"2"} size={"sm"} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div class="text-xs text-muted-foreground">Recording...</div>
                  </div>
                </div>
              </Show>
            </Button>
            <Button
              size="sm"
              variant="muted"
              onClick={() => setStoreShortcut(SHOW_SNAP_OVERLAY_DEFAULT_SHORTCUT)}
            >
              Reset
            </Button>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center gap-1">
            <For each={buttons()}>{(b) => <KeyboardButton key={b} />}</For>
          </div>
        </div>
      </div>
    </div>
  );
}

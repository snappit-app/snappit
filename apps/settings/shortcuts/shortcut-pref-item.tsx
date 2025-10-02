import { BsRecordFill } from "solid-icons/bs";
import { createEffect, createMemo, For, Show, splitProps } from "solid-js";

import { RecordTooltip } from "@/apps/settings/general/record_tooltip";
import {
  COLOR_DROPPER_SHORTCUT_KEY,
  DIGITAL_RULER_SHORTCUT_KEY,
  QR_SHORTCUT_KEY,
  TEXT_CAPTURE_SHORTCUT_KEY,
} from "@/apps/settings/shortcuts";
import { fromGlobalShortcut, toGlobalShortcut } from "@/shared/libs/shortcut_recorder";
import createShortcutRecorder from "@/shared/libs/shortcut_recorder/shortcut_recorder";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";
import { TextSnapTrayApi } from "@/shared/tauri/snap_tray_api";
import { Button } from "@/shared/ui/button";
import { KeyboardButton } from "@/shared/ui/keyboard_button";

export const TOOL_SHORTCUTS: ShortcutPreferenceItemProps[] = [
  {
    label: "Text Capture",
    storeKey: TEXT_CAPTURE_SHORTCUT_KEY,
  },
  {
    label: "Digital Ruler",
    storeKey: DIGITAL_RULER_SHORTCUT_KEY,
  },
  {
    label: "Color Dropper",
    storeKey: COLOR_DROPPER_SHORTCUT_KEY,
  },
  {
    label: "QR Scanner",
    storeKey: QR_SHORTCUT_KEY,
  },
];

type ShortcutPreferenceItemProps = {
  label: string;
  storeKey: string;
};

export function ShortcutPreferenceItem(props: ShortcutPreferenceItemProps) {
  const [local] = splitProps(props, ["label", "storeKey"]);

  const [storeShortcut, setStoreShortcut] = SnapOverlayApi.createStoredShortcut(local.storeKey);

  const { candidate, savedShortcut, isRecording, startRecording } = createShortcutRecorder({
    minModKeys: 1,
  });

  const buttons = createMemo<string[]>(() => {
    const stored = storeShortcut();
    return stored ? fromGlobalShortcut(stored) : [];
  });

  createEffect(() => {
    const latest = savedShortcut();
    if (!latest.length) return;

    void (async () => {
      const globalShortcut = toGlobalShortcut(latest);
      await setStoreShortcut(globalShortcut);
      await TextSnapTrayApi.updateShortcuts();
    })();
  });

  return (
    <div class="flex items-center justify-between gap-4 py-3">
      <div class="flex flex-col">
        <span class="text-sm font-medium text-foreground">{local.label}</span>
        <Show
          when={buttons().length > 0}
          fallback={<span class="text-xs text-muted-foreground mt-2">Not set</span>}
        >
          <div class="flex gap-1 mt-2">
            <For each={buttons()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
          </div>
        </Show>
      </div>

      <Button
        class="relative flex items-center gap-2"
        variant="ghost"
        onClick={() => startRecording()}
      >
        <BsRecordFill size={"20"} />
        Record
        <Show when={isRecording()}>
          <RecordTooltip candidate={candidate} />
        </Show>
      </Button>
    </div>
  );
}

import { BsArrowCounterclockwise, BsRecordFill, BsTrash } from "solid-icons/bs";
import { createEffect, createMemo, For, Show } from "solid-js";

import {
  COLOR_DROPPER_SHORTCUT_KEY,
  DEFAULT_SHORTCUTS,
  DIGITAL_RULER_SHORTCUT_KEY,
  QR_SHORTCUT_KEY,
  SMART_SHORTCUT_KEY,
  TEXT_CAPTURE_SHORTCUT_KEY,
} from "@/apps/settings/shortcuts";
import { fromGlobalShortcut, toGlobalShortcut } from "@/shared/libs/shortcut_recorder";
import { RecordTooltip } from "@/shared/libs/shortcut_recorder";
import createShortcutRecorder from "@/shared/libs/shortcut_recorder/shortcut_recorder";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { SnappitTrayApi } from "@/shared/tauri/snap_tray_api";
import { Button } from "@/shared/ui/button";
import { KeyboardButton } from "@/shared/ui/keyboard_button";

type ShortcutPreferenceItem = {
  label: string;
  storeKey: string;
  target: SnappitOverlayTarget;
};

export const SMART_SHORTCUT: ShortcutPreferenceItem = {
  label: "Smart tool",
  storeKey: SMART_SHORTCUT_KEY,
  target: "smart_tool",
};

export const TOOL_SHORTCUTS: ShortcutPreferenceItem[] = [
  {
    label: "Text Capture",
    storeKey: TEXT_CAPTURE_SHORTCUT_KEY,
    target: "text_capture",
  },
  {
    label: "Digital Ruler",
    storeKey: DIGITAL_RULER_SHORTCUT_KEY,
    target: "digital_ruler",
  },
  {
    label: "Color Dropper",
    storeKey: COLOR_DROPPER_SHORTCUT_KEY,
    target: "color_dropper",
  },
  {
    label: "QR Scanner",
    storeKey: QR_SHORTCUT_KEY,
    target: "qr_scanner",
  },
];

type ShortcutPreferenceItemProps = {
  item: ShortcutPreferenceItem;
};

export function ShortcutPreferenceItem(props: ShortcutPreferenceItemProps) {
  const defaultCut = DEFAULT_SHORTCUTS[props.item.storeKey];
  const [storeShortcut, setStoreShortcut, removeShortcut] = SnapOverlayApi.createStoredShortcut(
    props.item.storeKey,
    props.item.target,
  );

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
      await SnappitTrayApi.updateShortcut(props.item.target);
    })();
  });

  return (
    <div class="flex items-center justify-between gap-4 py-3">
      <div class="flex flex-col">
        <span class="text-sm font-medium text-foreground">{props.item.label}</span>
        <Show
          when={buttons().length > 0}
          fallback={<span class="text-xs text-muted-foreground mt-2">Not set</span>}
        >
          <div class="flex gap-1 mt-2">
            <For each={buttons()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
          </div>
        </Show>
      </div>

      <div class="flex items-center gap-1">
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

        <Show when={!defaultCut}>
          <Button variant={"ghost"} size="icon" onClick={() => removeShortcut()}>
            <BsTrash />
          </Button>
        </Show>
        <Show when={defaultCut}>
          <Button variant={"ghost"} size="icon" onClick={() => setStoreShortcut(defaultCut)}>
            <BsArrowCounterclockwise />
          </Button>
        </Show>
      </div>
    </div>
  );
}

import { BiRegularRadioCircleMarked, BiRegularReset, BiSolidTrash } from "solid-icons/bi";
import { createEffect, createMemo, For, Show } from "solid-js";

import { clickOutside } from "@/shared/libs/click_outside_dir";
import { fromGlobalShortcut, toGlobalShortcut } from "@/shared/libs/shortcut_recorder";
import { RecordTooltip } from "@/shared/libs/shortcut_recorder";
import createShortcutRecorder from "@/shared/libs/shortcut_recorder/shortcut_recorder";
import {
  CAPTURE_SHORTCUT_KEY,
  COLOR_DROPPER_SHORTCUT_KEY,
  DEFAULT_SHORTCUTS,
  QR_SHORTCUT_KEY,
  ShortcutKeys,
  ShortcutsApi,
} from "@/shared/tauri/shortcuts_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { Button } from "@/shared/ui/button";
import { KeyboardButton } from "@/shared/ui/keyboard_button";
import { tooltip } from "@/shared/ui/tooltip";

void clickOutside;
void tooltip;

type ShortcutPreferenceItem = {
  label: string;
  storeKey: ShortcutKeys;
  target: SnappitOverlayTarget;
};

export const TOOL_SHORTCUTS: ShortcutPreferenceItem[] = [
  {
    label: "Capture",
    storeKey: CAPTURE_SHORTCUT_KEY,
    target: "capture",
  },
  // {
  //   label: "Digital Ruler",
  //   storeKey: DIGITAL_RULER_SHORTCUT_KEY,
  //   target: "digital_ruler",
  // },
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
  const [storeShortcut, setStoreShortcut, removeShortcut] = ShortcutsApi.createStoredShortcut(
    props.item.storeKey,
    props.item.target,
  );

  const { candidate, savedShortcut, isRecording, startRecording, stopRecording } =
    createShortcutRecorder({
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
    })();
  });

  return (
    <div class="py-3">
      <div class="text-sm font-medium text-foreground mb-2">{props.item.label}</div>
      <div class="flex items-center justify-between gap-4">
        <div>
          <Show
            when={buttons().length > 0}
            fallback={<span class="text-xs text-muted-foreground">Not set</span>}
          >
            <div class="flex gap-1">
              <For each={buttons()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
            </div>
          </Show>
        </div>

        <div class="flex items-center gap-1 py-[2px]">
          <Button
            class="relative flex items-center gap-2"
            variant="ghost"
            onClick={() => startRecording()}
          >
            <BiRegularRadioCircleMarked size={"20"} />
            Record
            <Show when={isRecording()}>
              <div
                class="absolute left-1/2 -top-13 -translate-x-1/2 -translate-y-1/2 "
                use:clickOutside={() => stopRecording()}
              >
                <RecordTooltip candidate={candidate} />
              </div>
            </Show>
          </Button>

          <Show when={!defaultCut}>
            <Button
              variant={"ghost"}
              size="icon"
              onClick={() => {
                void removeShortcut();
              }}
            >
              <BiSolidTrash />
            </Button>
          </Show>
          <Show when={defaultCut}>
            <Button
              variant={"ghost"}
              size="icon"
              onClick={() => {
                void setStoreShortcut(defaultCut);
              }}
            >
              <BiRegularReset />
            </Button>
          </Show>
        </div>
      </div>
    </div>
  );
}

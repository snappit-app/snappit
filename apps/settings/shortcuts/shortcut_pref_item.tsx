import {
  BiRegularQrScan,
  BiRegularRadioCircleMarked,
  BiRegularReset,
  BiSolidCopy,
  BiSolidEyedropper,
  BiSolidRuler,
  BiSolidTrash,
} from "solid-icons/bi";
import { Component, createEffect, createMemo, For, Show } from "solid-js";

import { clickOutside } from "@/shared/libs/click_outside_dir";
import { fromGlobalShortcut, toGlobalShortcut } from "@/shared/libs/shortcut_recorder";
import { RecordTooltip } from "@/shared/libs/shortcut_recorder";
import createShortcutRecorder from "@/shared/libs/shortcut_recorder/shortcut_recorder";
import {
  CAPTURE_SHORTCUT_KEY,
  COLOR_DROPPER_SHORTCUT_KEY,
  DEFAULT_SHORTCUTS,
  DIGITAL_RULER_SHORTCUT_KEY,
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
  Icon: Component;
};

export const TOOL_SHORTCUTS: ShortcutPreferenceItem[] = [
  {
    label: "Capture",
    storeKey: CAPTURE_SHORTCUT_KEY,
    target: "capture",
    Icon: BiSolidCopy,
  },
  {
    label: "Digital Ruler",
    storeKey: DIGITAL_RULER_SHORTCUT_KEY,
    target: "digital_ruler",
    Icon: BiSolidRuler,
  },
  {
    label: "Color Dropper",
    storeKey: COLOR_DROPPER_SHORTCUT_KEY,
    target: "color_dropper",
    Icon: BiSolidEyedropper,
  },
  {
    label: "QR Scanner",
    storeKey: QR_SHORTCUT_KEY,
    target: "qr_scanner",
    Icon: BiRegularQrScan,
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
    <div class="py-3 first:pt-0 last:pb-0">
      <div class="text-sm font-extralight text-foreground mb-2 border-b pb-1 flex gap-3 items-center ">
        <props.item.Icon /> {props.item.label}
      </div>
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
          <div
            use:tooltip={{
              content: () => (
                <div use:clickOutside={() => stopRecording()}>
                  <RecordTooltip candidate={candidate} />
                </div>
              ),
              show: isRecording,
            }}
          >
            <Button class="relative1" variant="ghost" onClick={() => startRecording()}>
              <div class="pr-1  flex items-center gap-1">
                <BiRegularRadioCircleMarked size={"16"} />
                Record
              </div>
            </Button>
          </div>

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

import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  BiRegularCheck,
  BiRegularCopy,
  BiRegularQr,
  BiRegularRuler,
  BiRegularText,
  BiRegularTrash,
  BiSolidPalette,
} from "solid-icons/bi";
import { Component, createSignal, Match, Switch } from "solid-js";

import { CaptureHistory, CaptureHistoryItem } from "@/shared/history";
import { Button } from "@/shared/ui/button";

interface HistoryItemProps {
  item: CaptureHistoryItem;
}

const COPY_FEEDBACK_DURATION = 5000;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) + ` ${time}`;
}

function getDisplayValue(item: CaptureHistoryItem): string {
  switch (item.type) {
    case "ocr":
      return item.payload.text;
    case "qr":
      return item.payload.content;
    case "dropper":
      return item.payload.formattedColor;
    case "ruler":
      return item.payload.value;
  }
}

function getCopyValue(item: CaptureHistoryItem): string {
  return getDisplayValue(item);
}

export const HistoryItem: Component<HistoryItemProps> = (props) => {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = async () => {
    const value = getCopyValue(props.item);
    await writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
  };

  const handleDelete = async () => {
    await CaptureHistory.remove(props.item.id);
  };

  return (
    <div class="flex items-center gap-3 p-3 bg-card rounded-lg overflow-hidden">
      <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-muted">
        <Switch>
          <Match when={props.item.type === "ocr"}>
            <BiRegularText class="w-4 h-4" />
          </Match>
          <Match when={props.item.type === "qr"}>
            <BiRegularQr class="w-4 h-4" />
          </Match>
          <Match when={props.item.type === "dropper"}>
            <BiSolidPalette class="w-4 h-4" />
          </Match>
          <Match when={props.item.type === "ruler"}>
            <BiRegularRuler class="w-4 h-4" />
          </Match>
        </Switch>
      </div>

      <div class="flex-1 min-w-0 overflow-hidden">
        <p class="text-sm truncate">{getDisplayValue(props.item)}</p>
        <p class="text-xs text-muted-foreground">{formatTime(props.item.timestamp)}</p>
      </div>

      <div class="flex gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" class="h-8 w-8" onClick={handleCopy}>
          <Switch>
            <Match when={copied()}>
              <BiRegularCheck class="w-4 h-4" />
            </Match>
            <Match when={!copied()}>
              <BiRegularCopy class="w-4 h-4" />
            </Match>
          </Switch>
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" onClick={handleDelete}>
          <BiRegularTrash class="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

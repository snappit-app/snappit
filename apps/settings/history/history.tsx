import { listen, UnlistenFn } from "@tauri-apps/api/event";
import {
  BiRegularQr,
  BiRegularRuler,
  BiRegularSearch,
  BiRegularText,
  BiRegularTrash,
  BiSolidPalette,
} from "solid-icons/bi";
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { CaptureHistory, CaptureHistoryItem, HISTORY_UPDATED_EVENT } from "@/shared/history";
import { cn } from "@/shared/libs/cn";
import { SnappitStore } from "@/shared/store";
import { Button } from "@/shared/ui/button";

import { HistoryItem } from "./history_item";

type ToolType = CaptureHistoryItem["type"];

function getSearchableContent(item: CaptureHistoryItem): string {
  switch (item.type) {
    case "ocr":
      return item.payload.text;
    case "qr":
      return item.payload.content;
    case "dropper":
      return `${item.payload.hex} ${item.payload.formattedColor}`;
    case "ruler":
      return item.payload.value;
  }
}

export function History() {
  const [history] = CaptureHistory.create();
  const [searchQuery, setSearchQuery] = createSignal("");
  const [enabledFilters, setEnabledFilters] = createSignal<Set<ToolType>>(
    new Set(["ocr", "qr", "dropper", "ruler"]),
  );
  let unlisten: UnlistenFn | undefined;

  const items = createMemo(() => history() ?? []);
  const isEmpty = createMemo(() => items().length === 0);

  const filteredItems = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();
    const filters = enabledFilters();

    return items().filter((item) => {
      if (!filters.has(item.type)) return false;

      if (query) {
        const content = getSearchableContent(item).toLowerCase();
        return content.includes(query);
      }

      return true;
    });
  });

  const toggleFilter = (type: ToolType) => {
    setEnabledFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const isFilterEnabled = (type: ToolType) => enabledFilters().has(type);

  const handleClearAll = async () => {
    await CaptureHistory.clear();
  };

  onMount(async () => {
    await SnappitStore.sync();

    unlisten = await listen(HISTORY_UPDATED_EVENT, async () => {
      await SnappitStore.sync();
    });
  });

  onCleanup(() => {
    unlisten?.();
  });

  return (
    <div class="p-3 pb-0 flex flex-col min-h-0 h-full">
      <h2 class="text-center font-bold mb-3 text-xl shrink-0">History</h2>

      <Show when={!isEmpty()}>
        <div class="flex justify-end gap-2 mb-3 shrink-0">
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <BiRegularTrash class="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div class="flex justify-between mb-3 gap-3 shrink-0">
          <div class="relative flex-1 w-full">
            <BiRegularSearch class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div class="flex gap-1">
            <Button
              variant="product"
              size="icon"
              class={cn("h-8 w-8", !isFilterEnabled("ocr") && "opacity-30")}
              onClick={() => toggleFilter("ocr")}
              title="OCR"
            >
              <BiRegularText class="w-4 h-4" />
            </Button>
            <Button
              variant="product"
              size="icon"
              class={cn("h-8 w-8", !isFilterEnabled("qr") && "opacity-30")}
              onClick={() => toggleFilter("qr")}
              title="QR"
            >
              <BiRegularQr class="w-4 h-4" />
            </Button>
            <Button
              variant="product"
              size="icon"
              class={cn("h-8 w-8", !isFilterEnabled("dropper") && "opacity-30")}
              onClick={() => toggleFilter("dropper")}
              title="Color Picker"
            >
              <BiSolidPalette class="w-4 h-4" />
            </Button>
            <Button
              variant="product"
              size="icon"
              class={cn("h-8 w-8", !isFilterEnabled("ruler") && "opacity-30")}
              onClick={() => toggleFilter("ruler")}
              title="Ruler"
            >
              <BiRegularRuler class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Show>

      <Show
        when={!isEmpty()}
        fallback={
          <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p class="text-sm">No captures yet</p>
            <p class="text-xs mt-1">Your capture history will appear here</p>
          </div>
        }
      >
        <Show
          when={filteredItems().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p class="text-sm">No results found</p>
              <p class="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          }
        >
          <div class="border-t pt-3 flex flex-col gap-2 pb-3 -ml-3 pl-3 -mr-3 pr-3 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <For each={filteredItems()}>{(item) => <HistoryItem item={item} />}</For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

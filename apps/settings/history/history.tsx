import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BiRegularTrash } from "solid-icons/bi";
import { createMemo, For, onCleanup, onMount, Show } from "solid-js";

import { CaptureHistory, HISTORY_UPDATED_EVENT } from "@/shared/history";
import { SnappitStore } from "@/shared/store";
import { Button } from "@/shared/ui/button";

import { HistoryItem } from "./history_item";

export function History() {
  const [history] = CaptureHistory.create();
  let unlisten: UnlistenFn | undefined;

  const items = createMemo(() => history() ?? []);
  const isEmpty = createMemo(() => items().length === 0);

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
    <>
      <h2 class="text-center font-bold mb-3 text-xl">History</h2>

      <Show when={!isEmpty()}>
        <div class="flex justify-end mb-3">
          <Button variant="destructive" size="sm" onClick={handleClearAll}>
            <BiRegularTrash class="w-4 h-4 mr-2" />
            Clear All
          </Button>
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
        <div class="flex flex-col gap-2 max-w-[398px]">
          <For each={items()}>{(item) => <HistoryItem item={item} />}</For>
        </div>
      </Show>
    </>
  );
}

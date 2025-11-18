import { For } from "solid-js";

import { ShortcutPreferenceItem, TOOL_SHORTCUTS } from "@/apps/settings/preferences";

export function Shortcuts() {
  return (
    <div class="p-6">
      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">Tool Shortcuts</h2>
          <p class="text-sm text-muted-foreground">
            Set dedicated shortcuts for each Snappit tool.
          </p>
        </div>

        <div class="divide-y">
          <For each={TOOL_SHORTCUTS}>{(item) => <ShortcutPreferenceItem item={item} />}</For>
        </div>
      </div>
    </div>
  );
}

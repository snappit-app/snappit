import { For } from "solid-js";

import { ShortcutPreferenceItem, TOOL_SHORTCUTS } from "@/apps/settings/preferences";

export function Shortcuts() {
  return (
    <div class="border rounded-lg p-3">
      <div class="divide-y">
        <For each={TOOL_SHORTCUTS}>{(item) => <ShortcutPreferenceItem item={item} />}</For>
      </div>
    </div>
  );
}

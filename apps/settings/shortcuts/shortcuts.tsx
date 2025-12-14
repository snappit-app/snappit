import { For } from "solid-js";

import { ShortcutPreferenceItem, TOOL_SHORTCUTS } from "@/apps/settings/preferences";

export function Shortcuts() {
  return (
    <>
      <For each={TOOL_SHORTCUTS}>
        {(item) => (
          <div class="rounded-lg p-3 bg-card mb-3">
            <ShortcutPreferenceItem item={item} />
          </div>
        )}
      </For>
    </>
  );
}

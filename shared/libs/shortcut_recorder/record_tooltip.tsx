import { KeyboardButton } from "@shared/ui/keyboard_button";
import { Accessor, For } from "solid-js";

export type recordTooltipProps = {
  candidate: Accessor<string[]>;
};

export function RecordTooltip(props: recordTooltipProps) {
  return (
    <div
      class="absolute left-1/2 -top-13 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow z-1 cursor-default before:content-[''] before:absolute
            before:-bottom-1 before:left-1/2 before:-translate-x-1/2
            before:w-3 before:h-3 before:bg-popover before:rotate-45 before:-z-1
            before:shadow"
    >
      <div class="h-full w-full bg-card text-popover-foreground z-1 p-3 rounded-lg">
        <div class="text-sm mb-2 flex gap-1">
          <For each={props.candidate()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
          {!props.candidate().length && (
            <div class="flex gap-3 items-center text-muted-foreground">
              <span class="text-xs">e.g</span>
              <div class="flex gap-1">
                <KeyboardButton key={"Meta"} size={"sm"} />
                <KeyboardButton key={"Shift"} size={"sm"} />
                <KeyboardButton key={"2"} size={"sm"} />
              </div>
            </div>
          )}
        </div>
        <div class="text-xs text-muted-foreground">Recording...</div>
      </div>
    </div>
  );
}

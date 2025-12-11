import { KeyboardButton } from "@shared/ui/keyboard_button";
import { Accessor, For } from "solid-js";

export type recordTooltipProps = {
  candidate: Accessor<string[]>;
};

export function RecordTooltip(props: recordTooltipProps) {
  return (
    <div class="h-full w-full">
      <div class="text-sm mb-1 flex gap-1">
        <For each={props.candidate()}>{(b) => <KeyboardButton key={b} size={"sm"} />}</For>
        {!props.candidate().length && (
          <div class="flex gap-2 items-center text-muted-foreground">
            <span class="text-xs">e.g</span>
            <div class="flex gap-1">
              <KeyboardButton key={"Meta"} size={"sm"} />
              <KeyboardButton key={"Shift"} size={"sm"} />
              <KeyboardButton key={"2"} size={"sm"} />
            </div>
          </div>
        )}
      </div>
      <div class="text-xs text-muted-foreground ">Recording...</div>
    </div>
  );
}

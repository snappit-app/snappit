import { cn } from "@shared/libs/cn";
import { makeEventListener } from "@solid-primitives/event-listener";
import { createMemo, createSignal } from "solid-js";

export type keyboardButtonProps = {
  key: string;
};

export function KeyboardButton(props: keyboardButtonProps) {
  const [keyPressed, setKeyPressed] = createSignal(false);

  const bgClass = createMemo(() => (keyPressed() ? "bg-gray-200" : ""));

  makeEventListener(window, "keydown", (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === props.key.toLowerCase()) {
      setKeyPressed(true);
    }
  });
  makeEventListener(window, "keyup", (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === props.key.toLowerCase()) {
      setKeyPressed(false);
    }
  });

  return (
    <div
      class={cn(
        "w-[72px] h-[72px] bg-accent flex justify-center items-center rounded-md",
        bgClass(),
      )}
    >
      <span class="text-sm text-accent-foreground">{props.key}</span>
    </div>
  );
}

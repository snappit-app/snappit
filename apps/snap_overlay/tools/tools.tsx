import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { BsGripVertical } from "solid-icons/bs";
import { JSX, splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createDnd } from "@/shared/libs/dnd";
import { Button } from "@/shared/ui/button";

export type toolsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string;
};

export function Tools(props: toolsProps) {
  const [local, rest] = splitProps(props as toolsProps, ["class"]);
  const { setEl, pos, onHandlePointerDown } = createDnd();

  const onButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={setEl}
      class={cn(
        "absolute z-10 bg-card rounded-lg border p-1 flex items-center gap-1 select-none",
        local.class,
      )}
      style={{ left: `${pos().x}px`, top: `${pos().y}px` }}
      {...rest}
    >
      <div
        class="px-1 py-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onPointerDown={onHandlePointerDown}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Drag handle"
      >
        <BsGripVertical />
      </div>

      <Button onClick={onButtonClick} variant={"ghost"} size="icon">
        <BiRegularCopy />
      </Button>
      <Button onClick={onButtonClick} variant={"ghost"} size="icon">
        <BiSolidRuler />
      </Button>
      <Button onClick={onButtonClick} variant={"ghost"} size="icon">
        <BiSolidEyedropper />
      </Button>
      <Button onClick={onButtonClick} variant={"ghost"} size="icon">
        <BiRegularQrScan />
      </Button>
    </div>
  );
}

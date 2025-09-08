import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { BsGripVertical, BsMagic } from "solid-icons/bs";
import { createSignal, JSX, splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createDnd } from "@/shared/libs/dnd";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

export type toolsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string;
};

export function Tools(props: toolsProps) {
  const [value, setValue] = createSignal("smart");
  const [local, rest] = splitProps(props as toolsProps, ["class"]);
  const { setEl, pos, onHandlePointerDown } = createDnd();

  return (
    <div
      ref={setEl}
      class={cn(
        "absolute z-10 bg-card/85 rounded-lg p-1 flex items-center gap-1 select-none",
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

      <ToggleGroup value={value()} variant={"ghost"}>
        <ToggleGroupItem value="smart" onClick={() => setValue("smart")}>
          <BsMagic />
        </ToggleGroupItem>
        <ToggleGroupItem value="copy" onClick={() => setValue("copy")}>
          <BiRegularCopy />
        </ToggleGroupItem>
        <ToggleGroupItem value="ruler" onClick={() => setValue("ruler")}>
          <BiSolidRuler />
        </ToggleGroupItem>
        <ToggleGroupItem value="dropper" onClick={() => setValue("dropper")}>
          <BiSolidEyedropper />
        </ToggleGroupItem>
        <ToggleGroupItem value="scan" onClick={() => setValue("scan")}>
          <BiRegularQrScan />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

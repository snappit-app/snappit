import { UnlistenFn } from "@tauri-apps/api/event";
import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { BsGripVertical, BsMagic } from "solid-icons/bs";
import { JSX, onCleanup, splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createDnd } from "@/shared/libs/dnd";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export type ToolValue = "smart" | "copy" | "ruler" | "dropper" | "scan";

export type toolsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string;
  value: ToolValue;
  onValueChange: (value: ToolValue) => void;
};

export function Tools(props: toolsProps) {
  let unlistenShown: UnlistenFn | undefined;

  const [local, rest] = splitProps(props as toolsProps, ["class", "value", "onValueChange"]);
  const { setEl, pos, onHandlePointerDown } = createDnd({
    initialPosition: "bottomCenter",
  });

  onCleanup(async () => {
    if (unlistenShown) {
      unlistenShown();
    }
  });

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

      <ToggleGroup value={local.value} variant={"ghost"}>
        <div use:tooltip={"Smart Tool"}>
          <ToggleGroupItem value="smart" onClick={() => local.onValueChange("smart")}>
            <BsMagic />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"Text Capture"}>
          <ToggleGroupItem value="copy" onClick={() => local.onValueChange("copy")}>
            <BiRegularCopy />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"Ruler Tool"}>
          <ToggleGroupItem value="ruler" onClick={() => local.onValueChange("ruler")}>
            <BiSolidRuler />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"Color Picker"}>
          <ToggleGroupItem value="dropper" onClick={() => local.onValueChange("dropper")}>
            <BiSolidEyedropper />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"QR Scanner"}>
          <ToggleGroupItem value="scan" onClick={() => local.onValueChange("scan")}>
            <BiRegularQrScan />
          </ToggleGroupItem>
        </div>
      </ToggleGroup>
    </div>
  );
}

import { UnlistenFn } from "@tauri-apps/api/event";
import { BiRegularQrScan, BiSolidCopy, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { JSX, onCleanup, splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { createDnd } from "@/shared/libs/dnd";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle_group";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export type toolsProps = JSX.HTMLAttributes<HTMLDivElement> & {
  class?: string;
  value: SnappitOverlayTarget;
  onValueChange: (value: SnappitOverlayTarget) => void;
};

export function Tools(props: toolsProps) {
  let unlistenShown: UnlistenFn | undefined;

  const [local, rest] = splitProps(props as toolsProps, ["class", "value", "onValueChange"]);
  const { setEl, pos } = createDnd({
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
      <ToggleGroup value={local.value} variant={"ghost"}>
        <div use:tooltip={"Capture"}>
          <ToggleGroupItem value="capture" onClick={() => local.onValueChange("capture")}>
            <BiSolidCopy />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"Ruler Tool"}>
          <ToggleGroupItem
            value="digital_ruler"
            onClick={() => local.onValueChange("digital_ruler")}
          >
            <BiSolidRuler />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"Color Picker"}>
          <ToggleGroupItem
            value="color_dropper"
            onClick={() => local.onValueChange("color_dropper")}
          >
            <BiSolidEyedropper />
          </ToggleGroupItem>
        </div>
        <div use:tooltip={"QR Scanner"}>
          <ToggleGroupItem value="qr_scanner" onClick={() => local.onValueChange("qr_scanner")}>
            <BiRegularQrScan />
          </ToggleGroupItem>
        </div>
      </ToggleGroup>
    </div>
  );
}

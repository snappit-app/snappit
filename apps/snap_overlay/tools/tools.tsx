import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";

import { cn } from "@/shared/libs/cn";
import { Button } from "@/shared/ui/button";

export type toolsProps = {
  class?: string;
};

export function Tools(props: toolsProps) {
  const onButtonClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      class={cn(
        "bg-card rounded-lg border p-1 left-1/2 flex items-center -translate-x-1/2 gap-1 z-2",
        props.class,
      )}
    >
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

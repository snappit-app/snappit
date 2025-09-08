import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { TooltipContentProps } from "@kobalte/core/tooltip";
import { JSX, splitProps, type ValidComponent } from "solid-js";

import { cn } from "@/shared/libs/cn";

type tooltipContentProps<T extends ValidComponent = "div"> = TooltipContentProps<T> & {
  class?: string;
  children: JSX.Element;
};

export const Tooltip = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, tooltipContentProps<T>>,
) => {
  const [local, rest] = splitProps(props as tooltipContentProps, ["class", "children"]);

  return (
    <div
      class={cn(
        "z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
};

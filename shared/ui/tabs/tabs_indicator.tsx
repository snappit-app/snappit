import { PolymorphicProps } from "@kobalte/core";
import { Tabs as TabsPrimitive, TabsIndicatorProps } from "@kobalte/core/tabs";
import { cva, VariantProps } from "class-variance-authority";
import { splitProps, ValidComponent, VoidProps } from "solid-js";

import { cn } from "@shared/libs/cn";

const tabsIndicatorVariants = cva("absolute transition-all duration-200 outline-none", {
  variants: {
    variant: {
      block:
        "data-[orientation=horizontal]:bottom-1 data-[orientation=horizontal]:left-0 data-[orientation=vertical]:right-1 data-[orientation=vertical]:top-0 data-[orientation=horizontal]:h-[calc(100%-0.5rem)] data-[orientation=vertical]:w-[calc(100%-0.5rem)] bg-background shadow rounded-md peer-focus-visible:ring-[1.5px] peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-focus-visible:outline-none",
      underline:
        "data-[orientation=horizontal]:-bottom-[1px] data-[orientation=horizontal]:left-0 data-[orientation=vertical]:-right-[1px] data-[orientation=vertical]:top-0 data-[orientation=horizontal]:h-[2px] data-[orientation=vertical]:w-[2px] bg-primary",
    },
  },
  defaultVariants: {
    variant: "block",
  },
});

type tabsIndicatorProps<T extends ValidComponent = "div"> = VoidProps<
  TabsIndicatorProps<T> &
    VariantProps<typeof tabsIndicatorVariants> & {
      class?: string;
    }
>;

export const TabsIndicator = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, tabsIndicatorProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsIndicatorProps, ["class", "variant"]);

  return (
    <TabsPrimitive.Indicator
      class={cn(tabsIndicatorVariants({ variant: local.variant }), local.class)}
      {...rest}
    />
  );
};

import { PolymorphicProps } from "@kobalte/core";
import { Tabs as TabsPrimitive, TabsListProps } from "@kobalte/core/tabs";
import { splitProps, ValidComponent } from "solid-js";

import { cn } from "@shared/libs/cn";

type tabsListProps<T extends ValidComponent = "div"> = TabsListProps<T> & {
  class?: string;
};

export const TabsList = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, tabsListProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsListProps, ["class"]);

  return (
    <TabsPrimitive.List
      class={cn(
        "relative flex w-full rounded-lg bg-muted p-1 text-muted-foreground data-[orientation=vertical]:flex-col data-[orientation=horizontal]:items-center data-[orientation=vertical]:items-stretch",
        local.class,
      )}
      {...rest}
    />
  );
};

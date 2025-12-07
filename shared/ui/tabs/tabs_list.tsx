import { PolymorphicProps } from "@kobalte/core";
import { Tabs as TabsPrimitive, TabsListProps } from "@kobalte/core/tabs";
import { cn } from "@shared/libs/cn";
import { splitProps, ValidComponent } from "solid-js";

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
        "relative flex gap-1 w-full rounded-full bg-muted p-[3px] text-muted-foreground data-[orientation=vertical]:flex-col data-[orientation=horizontal]:items-center data-[orientation=vertical]:items-stretch",
        local.class,
      )}
      {...rest}
    />
  );
};

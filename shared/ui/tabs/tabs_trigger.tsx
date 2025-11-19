import { PolymorphicProps } from "@kobalte/core";
import { Tabs as TabsPrimitive, TabsTriggerProps } from "@kobalte/core/tabs";
import { cn } from "@shared/libs/cn";
import { splitProps, ValidComponent } from "solid-js";

type tabsTriggerProps<T extends ValidComponent = "button"> = TabsTriggerProps<T> & {
  class?: string;
};

export const TabsTrigger = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, tabsTriggerProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsTriggerProps, ["class"]);

  return (
    <TabsPrimitive.Trigger
      class={cn(
        "cursor-pointer peer relative z-10 inline-flex h-7 w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-foreground",
        local.class,
      )}
      {...rest}
    />
  );
};

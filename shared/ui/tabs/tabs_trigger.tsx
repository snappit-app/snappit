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
        "peer text-foreground relative z-10 inline-flex gap-2 h-7 font-extralight w-full items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 data-[selected]:text-product-foreground data-[selected]:bg-product data-[orientation=vertical]:justify-start dark:window-inactive:data-[selected]:bg-muted window-inactive:data-[selected]:bg-muted-foreground",
        local.class,
      )}
      {...rest}
    />
  );
};

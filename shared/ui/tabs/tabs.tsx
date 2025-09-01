import { PolymorphicProps } from "@kobalte/core";
import { TabsRootProps } from "@kobalte/core/tabs";
import { Tabs as TabsPrimitive } from "@kobalte/core/tabs";
import { cn } from "@shared/libs/cn";
import { splitProps, ValidComponent } from "solid-js";

type tabsProps<T extends ValidComponent = "div"> = TabsRootProps<T> & {
  class?: string;
};

export const Tabs = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, tabsProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsProps, ["class"]);

  return (
    <TabsPrimitive class={cn("w-full data-[orientation=vertical]:flex", local.class)} {...rest} />
  );
};

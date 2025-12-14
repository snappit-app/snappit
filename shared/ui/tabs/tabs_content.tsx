import { PolymorphicProps } from "@kobalte/core";
import { Tabs as TabsPrimitive, TabsContentProps } from "@kobalte/core/tabs";
import { cn } from "@shared/libs/cn";
import { splitProps, ValidComponent } from "solid-js";

type tabsContentProps<T extends ValidComponent = "div"> = TabsContentProps<T> & {
  class?: string;
};

export const TabsContent = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, tabsContentProps<T>>,
) => {
  const [local, rest] = splitProps(props as tabsContentProps, ["class"]);

  return (
    <TabsPrimitive.Content
      class={cn(
        "transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        local.class,
      )}
      {...rest}
    />
  );
};

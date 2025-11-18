import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ToggleGroupItemProps, ToggleGroupRootProps } from "@kobalte/core/toggle-group";
import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import { cn } from "@shared/libs/cn";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { Accessor, ParentProps, ValidComponent } from "solid-js";
import { createContext, createMemo, splitProps, useContext } from "solid-js";

import { toggleVariants } from "./toggle";

const toggleGroupRootVariants = cva("flex items-center justify-center gap-1 rounded-md p-1", {
  variants: {
    variant: {
      default: "bg-muted",
      outline: "bg-muted",
      ghost: "bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const toggleGroupItemVariants = cva("", {
  variants: {
    color: {
      default: "",
      product: "data-[pressed]:bg-product data-[pressed]:text-product-foreground",
    },
  },
  defaultVariants: {
    color: "default",
  },
});

type ToggleGroupContextValue = VariantProps<typeof toggleVariants> &
  VariantProps<typeof toggleGroupItemVariants>;

const ToggleGroupContext = createContext<Accessor<ToggleGroupContextValue>>();

const useToggleGroup = () => {
  const context = useContext(ToggleGroupContext);

  if (!context) {
    throw new Error("`useToggleGroup`: must be used within a `ToggleGroup` component");
  }

  return context;
};

type toggleGroupProps<T extends ValidComponent = "div"> = ParentProps<
  ToggleGroupRootProps<T> &
    VariantProps<typeof toggleVariants> &
    VariantProps<typeof toggleGroupItemVariants> & {
      class?: string;
    }
>;

export const ToggleGroup = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, toggleGroupProps<T>>,
) => {
  const [local, rest] = splitProps(props as toggleGroupProps, [
    "class",
    "children",
    "size",
    "variant",
    "color",
  ]);

  const value = createMemo<ToggleGroupContextValue>(() => ({
    size: local.size,
    variant: local.variant,
    color: local.color,
  }));

  return (
    <ToggleGroupPrimitive
      class={cn(toggleGroupRootVariants({ variant: local.variant }), local.class)}
      {...rest}
    >
      <ToggleGroupContext.Provider value={value}>{local.children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
};

type toggleGroupItemProps<T extends ValidComponent = "button"> = ToggleGroupItemProps<T> & {
  class?: string;
};

export const ToggleGroupItem = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, toggleGroupItemProps<T>>,
) => {
  const [local, rest] = splitProps(props as toggleGroupItemProps, ["class"]);
  const context = useToggleGroup();

  return (
    <ToggleGroupPrimitive.Item
      class={cn(
        toggleVariants({
          variant: context().variant,
          size: context().size,
        }),
        toggleGroupItemVariants({
          color: context().color,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

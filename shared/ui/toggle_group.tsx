import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ToggleGroupItemProps, ToggleGroupRootProps } from "@kobalte/core/toggle-group";
import { ToggleGroup as ToggleGroupPrimitive } from "@kobalte/core/toggle-group";
import { cn } from "@shared/libs/cn";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { Accessor, ParentProps, ValidComponent } from "solid-js";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
  splitProps,
  useContext,
} from "solid-js";

import { toggleVariants } from "./toggle";

const toggleGroupRootVariants = cva(
  "relative flex items-center justify-center gap-1 rounded-full p-[3px]",
  {
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
  },
);

const toggleGroupItemVariants = cva("", {
  variants: {
    color: {
      default: "",
      product: "",
    },
  },
  defaultVariants: {
    color: "default",
  },
});

const toggleGroupIndicatorVariants = cva("absolute z-0 rounded-full pointer-events-none", {
  variants: {
    variant: {
      default: "bg-card",
      outline: "bg-card",
      ghost: "bg-accent",
    },
    color: {
      default: "",
      product: "bg-product",
    },
  },
  defaultVariants: {
    variant: "default",
    color: "default",
  },
});

type ToggleGroupContextValue = VariantProps<typeof toggleVariants> &
  VariantProps<typeof toggleGroupItemVariants> & {
    registerItem: (value: string, el: HTMLElement) => void;
  };

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

  let containerRef: HTMLDivElement | undefined;
  const itemsMap = new Map<string, HTMLElement>();
  let isInitialized = false;

  const [indicatorStyle, setIndicatorStyle] = createSignal<{
    left: number;
    width: number;
    height: number;
    opacity: number;
  }>({ left: 0, width: 0, height: 0, opacity: 0 });

  const [animationEnabled, setAnimationEnabled] = createSignal(false);

  const updateIndicator = () => {
    const currentValue = rest.value as string | undefined;
    if (!currentValue || !containerRef) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeEl = itemsMap.get(currentValue);
    if (!activeEl) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = containerRef.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();

    setIndicatorStyle({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
      height: activeRect.height,
      opacity: 1,
    });

    // Enable animation after first positioning
    if (!isInitialized) {
      isInitialized = true;
      requestAnimationFrame(() => {
        setAnimationEnabled(true);
      });
    }
  };

  const registerItem = (value: string, el: HTMLElement) => {
    itemsMap.set(value, el);
    updateIndicator();
  };

  const value = createMemo<ToggleGroupContextValue>(() => ({
    size: local.size,
    variant: local.variant,
    color: local.color,
    registerItem,
  }));

  // Update indicator when value changes
  createEffect(
    on(
      () => rest.value,
      () => updateIndicator(),
    ),
  );

  return (
    <ToggleGroupPrimitive
      ref={containerRef}
      class={cn(toggleGroupRootVariants({ variant: local.variant }), local.class)}
      {...rest}
    >
      <div
        class={cn(
          toggleGroupIndicatorVariants({ variant: local.variant, color: local.color }),
          animationEnabled() && "transition-all duration-200 ease-out",
          indicatorStyle().opacity === 0 && "opacity-0",
        )}
        style={{
          left: `${indicatorStyle().left}px`,
          width: `${indicatorStyle().width}px`,
          height: `${indicatorStyle().height}px`,
        }}
      />
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

  let itemRef: HTMLButtonElement | undefined;

  onMount(() => {
    if (itemRef && rest.value) {
      context().registerItem(rest.value as string, itemRef);
    }
  });

  return (
    <ToggleGroupPrimitive.Item
      ref={itemRef}
      class={cn(
        toggleVariants({
          variant: context().variant,
          size: context().size,
        }),
        toggleGroupItemVariants({
          color: context().color,
        }),
        // Remove background styles from item since indicator handles it, z-10 to stay above indicator
        "relative z-10 bg-transparent data-[pressed]:bg-transparent data-[state=on]:bg-transparent",
        context().color === "product" &&
          "data-[pressed]:text-product-foreground data-[state=on]:text-product-foreground",
        local.class,
      )}
      {...rest}
    />
  );
};

import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { SwitchControlProps, SwitchThumbProps } from "@kobalte/core/switch";
import { Switch as SwitchPrimitive } from "@kobalte/core/switch";
import { cn } from "@shared/libs/cn";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ParentProps, ValidComponent, VoidProps } from "solid-js";
import { createContext, splitProps, useContext } from "solid-js";

export const SwitchLabel = SwitchPrimitive.Label;
export const Switch = SwitchPrimitive;
export const SwitchErrorMessage = SwitchPrimitive.ErrorMessage;
export const SwitchDescription = SwitchPrimitive.Description;

const switchControlVariants = cva(
  "inline-flex h-5 w-9 shrink-0  items-center rounded-full border-2 border-transparent bg-input shadow-sm transition-[color,background-color,box-shadow] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[checked]:bg-primary",
        product: "data-[checked]:bg-product",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type switchControlProps<T extends ValidComponent = "input"> = ParentProps<
  SwitchControlProps<T> & VariantProps<typeof switchControlVariants> & { class?: string }
>;

type SwitchVariant = VariantProps<typeof switchControlVariants>["variant"];
const SwitchVariantContext = createContext<SwitchVariant>("default");

export const SwitchControl = <T extends ValidComponent = "input">(
  props: PolymorphicProps<T, switchControlProps<T>>,
) => {
  const [local, rest] = splitProps(props as switchControlProps, ["class", "children", "variant"]);

  return (
    <>
      <SwitchPrimitive.Input class="[&:focus-visible+div]:outline-none [&:focus-visible+div]:ring-[1.5px] [&:focus-visible+div]:ring-ring [&:focus-visible+div]:ring-offset-2 [&:focus-visible+div]:ring-offset-background" />
      <SwitchVariantContext.Provider value={local.variant ?? "default"}>
        <SwitchPrimitive.Control
          class={cn(
            switchControlVariants({
              variant: local.variant,
            }),
            local.class,
          )}
          {...rest}
        >
          {local.children}
        </SwitchPrimitive.Control>
      </SwitchVariantContext.Provider>
    </>
  );
};

const switchThumbVariants = cva(
  "pointer-events-none block h-4 w-4 translate-x-0 rounded-full shadow-lg ring-0 transition-transform data-[checked]:translate-x-4",
  {
    variants: {
      variant: {
        default: "bg-background",
        product: "bg-product-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type switchThumbProps<T extends ValidComponent = "div"> = VoidProps<
  SwitchThumbProps<T> & VariantProps<typeof switchControlVariants> & { class?: string }
>;

export const SwitchThumb = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, switchThumbProps<T>>,
) => {
  const [local, rest] = splitProps(props as switchThumbProps, ["class", "variant"]);
  const variant = local.variant ?? useContext(SwitchVariantContext);

  return (
    <SwitchPrimitive.Thumb
      class={cn(
        switchThumbVariants({
          variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

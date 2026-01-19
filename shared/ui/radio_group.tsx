import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type {
  RadioGroupItemControlProps,
  RadioGroupItemProps,
  RadioGroupRootProps,
} from "@kobalte/core/radio-group";
import { RadioGroup as RadioGroupPrimitive } from "@kobalte/core/radio-group";
import { cva } from "class-variance-authority";
import type { JSX, ParentProps, ValidComponent, VoidProps } from "solid-js";
import { createContext, splitProps, useContext } from "solid-js";

import { cn } from "@/shared/libs/cn";

export const RadioGroupLabel = RadioGroupPrimitive.Label;
export const RadioGroupDescription = RadioGroupPrimitive.Description;
export const RadioGroupErrorMessage = RadioGroupPrimitive.ErrorMessage;
export const RadioGroupItemInput = RadioGroupPrimitive.ItemInput;
export const RadioGroupItemLabel = RadioGroupPrimitive.ItemLabel;
export const RadioGroupItemDescription = RadioGroupPrimitive.ItemDescription;

type RadioGroupVariant = "default" | "product";
const RadioGroupVariantContext = createContext<RadioGroupVariant>("default");

type radioGroupProps<T extends ValidComponent = "div"> = RadioGroupRootProps<T> & {
  class?: string;
  variant?: RadioGroupVariant;
};

export const RadioGroup = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, radioGroupProps<T>>,
) => {
  const [local, rest] = splitProps(props as radioGroupProps, ["class", "variant"]);

  return (
    <RadioGroupVariantContext.Provider value={local.variant ?? "default"}>
      <RadioGroupPrimitive class={cn("flex flex-col gap-3", local.class)} {...rest} />
    </RadioGroupVariantContext.Provider>
  );
};

type radioGroupItemProps<T extends ValidComponent = "div"> = RadioGroupItemProps<T> & {
  class?: string;
};

export const RadioGroupItem = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, radioGroupItemProps<T>>,
) => {
  const [local, rest] = splitProps(props as radioGroupItemProps, ["class"]);

  return <RadioGroupPrimitive.Item class={cn("flex items-center gap-2", local.class)} {...rest} />;
};

type radioGroupItemCardProps = ParentProps<{
  class?: string;
  value: string;
  headerClass?: string;
  header: JSX.Element;
  disabled?: boolean;
}>;

export const RadioGroupItemCard = (props: radioGroupItemCardProps) => {
  return (
    <RadioGroupPrimitive.Item value={props.value} class="contents" disabled={props.disabled}>
      <RadioGroupPrimitive.ItemInput class="peer sr-only" />
      <RadioGroupPrimitive.ItemLabel
        class={cn(
          "block",
          props.disabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "active:bg-muted/70",
          props.class,
        )}
      >
        <span class={cn("flex items-center justify-between", props.headerClass)}>
          <span>{props.header}</span>
          <RadioGroupItemControl />
        </span>
        {props.children}
      </RadioGroupPrimitive.ItemLabel>
    </RadioGroupPrimitive.Item>
  );
};

const radioGroupItemControlVariants = cva(
  "aspect-square h-4 w-4 rounded-full border transition-[color,background-color] focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "border-primary text-primary data-[checked]:bg-primary",
        product: "bg-muted text-product data-[checked]:bg-product data-[checked]:border-product",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type radioGroupItemControlProps<T extends ValidComponent = "div"> = VoidProps<
  RadioGroupItemControlProps<T> & { class?: string; variant?: RadioGroupVariant }
>;

export const RadioGroupItemControl = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, radioGroupItemControlProps<T>>,
) => {
  const [local, rest] = splitProps(props as radioGroupItemControlProps, ["class", "variant"]);
  const variant = local.variant ?? useContext(RadioGroupVariantContext);

  return (
    <>
      <RadioGroupPrimitive.ItemInput class="[&:focus-visible+div]:outline-none [&:focus-visible+div]:ring-[1.5px] [&:focus-visible+div]:ring-ring [&:focus-visible+div]:ring-offset-2 [&:focus-visible+div]:ring-offset-background" />
      <RadioGroupPrimitive.ItemControl
        class={cn(radioGroupItemControlVariants({ variant }), local.class)}
        {...rest}
      >
        <RadioGroupPrimitive.ItemIndicator class="flex items-center justify-center">
          <svg viewBox="0 0 8 8" class="h-[6px] w-[6px] fill-current text-product-foreground">
            <circle cx="4" cy="4" r="4" />
          </svg>
        </RadioGroupPrimitive.ItemIndicator>
      </RadioGroupPrimitive.ItemControl>
    </>
  );
};

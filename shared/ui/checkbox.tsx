import type { CheckboxControlProps } from "@kobalte/core/checkbox";
import { Checkbox as CheckboxPrimitive } from "@kobalte/core/checkbox";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ValidComponent, VoidProps } from "solid-js";
import { splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";

export const CheckboxLabel = CheckboxPrimitive.Label;
export const Checkbox = CheckboxPrimitive;
export const CheckboxErrorMessage = CheckboxPrimitive.ErrorMessage;
export const CheckboxDescription = CheckboxPrimitive.Description;

const checkboxControlVariants = cva(
  "h-4 w-4 shrink-0 rounded-sm shadow bg-muted transition-shadow focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  {
    variants: {
      color: {
        default: "data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        product:
          "data-[checked]:bg-product data-[checked]:text-product-foreground window-inactive:data-[checked]:bg-muted",
      },
    },
    defaultVariants: {
      color: "default",
    },
  },
);

type checkboxControlProps<T extends ValidComponent = "div"> = VoidProps<
  CheckboxControlProps<T> &
    VariantProps<typeof checkboxControlVariants> & {
      class?: string;
    }
>;

export const CheckboxControl = <T extends ValidComponent = "div">(
  props: PolymorphicProps<T, checkboxControlProps<T>>,
) => {
  const [local, rest] = splitProps(props as checkboxControlProps, ["class", "children", "color"]);

  return (
    <>
      <CheckboxPrimitive.Input class="[&:focus-visible+div]:outline-none [&:focus-visible+div]:ring-[1.5px] [&:focus-visible+div]:ring-ring [&:focus-visible+div]:ring-offset-2 [&:focus-visible+div]:ring-offset-background" />
      <CheckboxPrimitive.Control
        class={cn(
          checkboxControlVariants({
            color: local.color,
          }),
          local.class,
        )}
        {...rest}
      >
        <CheckboxPrimitive.Indicator class="flex items-center justify-center text-current">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
            <path
              d="M6.5 12.5 L10.2 16.2 L17.8 8.8"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
            />
          </svg>
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Control>
    </>
  );
};

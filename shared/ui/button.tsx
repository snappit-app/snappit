import type { ButtonRootProps } from "@kobalte/core/button";
import { Button as ButtonPrimitive } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { cn } from "@shared/libs/cn";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-sm text-sm font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success: "text-success-foreground hover:bg-success/10",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-accent-foreground",
        product:
          "text-product hover:bg-product/10 hover:text-product window-inactive:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        muted: "bg-muted text-accent-foreground active:brightness-90",
      },
      size: {
        default: "h-7 px-2",
        sm: "h-6 px-3 text-xs",
        lg: "h-8 px-8",
        icon: "h-7 w-7",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        size: "sm",
        class: "px-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type buttonProps<T extends ValidComponent = "button"> = ButtonRootProps<T> &
  VariantProps<typeof buttonVariants> & {
    class?: string;
  };

export const Button = <T extends ValidComponent = "button">(
  props: PolymorphicProps<T, buttonProps<T>>,
) => {
  const [local, rest] = splitProps(props as buttonProps, ["class", "variant", "size"]);

  return (
    <ButtonPrimitive
      class={cn(
        buttonVariants({
          size: local.size,
          variant: local.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

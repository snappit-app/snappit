import { cva, VariantProps } from "class-variance-authority";
import { JSX, splitProps } from "solid-js";

import { cn } from "../libs/cn";

export const tagVariants = cva(
  "px-2 py-[1px] rounded-full text-[10px] bg-product text-product-foreground whitespace-nowrap inline-flex gap-1 items-center",
  {
    variants: {
      variant: {
        default: "bg-product text-product-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type tagProps = VariantProps<typeof tagVariants> & {
  children: JSX.Element;
  class?: string;
};

export function Tag(props: tagProps) {
  const [local] = splitProps(props as tagProps, ["class", "variant"]);

  return (
    <div
      class={cn(
        tagVariants({
          variant: local.variant,
        }),
        local.class,
      )}
    >
      {props.children}
    </div>
  );
}

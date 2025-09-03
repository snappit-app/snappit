import { cn } from "@shared/libs/cn";
import { displayKey } from "@shared/libs/shortcut_recorder";
import { cva, VariantProps } from "class-variance-authority";
import { splitProps } from "solid-js";

export const buttonVariants = cva("w-[72px] h-[72px] bg-accent flex justify-center items-center", {
  variants: {
    size: {
      sm: "w-[20px] h-[20px] rounded text-xs",
      lg: "w-[72px] h-[72px] rounded-lg text-xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export type keyboardButtonProps = VariantProps<typeof buttonVariants> & {
  key: string;
  class?: string;
};

export function KeyboardButton(props: keyboardButtonProps) {
  const [local] = splitProps(props as keyboardButtonProps, ["class", "size"]);

  return (
    <div
      class={cn(
        buttonVariants({
          size: local.size,
        }),
        local.class,
      )}
    >
      <kbd class="text-accent-foreground">{displayKey(props.key)}</kbd>
    </div>
  );
}

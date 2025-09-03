import { cn } from "@shared/libs/cn";
import { displayKey, isModKey } from "@shared/libs/shortcut_recorder";
import { platform } from "@tauri-apps/plugin-os";
import { cva, VariantProps } from "class-variance-authority";
import { splitProps } from "solid-js";

export const buttonVariants = cva("bg-accent flex justify-center items-center", {
  variants: {
    size: {
      sm: "min-w-[36px] p-2 rounded",
      lg: "min-w-[68px] p-5 rounded-lg",
    },
    type: {
      mod: "",
      default: "",
    },
  },
  compoundVariants: [
    {
      type: "mod",
      size: "sm",
      class: "text-s",
    },
    {
      type: "default",
      size: "sm",
      class: "text-xs",
    },
    {
      type: "mod",
      size: "lg",
      class: "text-xl",
    },
    {
      type: "default",
      size: "lg",
      class: " text-lg",
    },
  ],
  defaultVariants: {
    size: "lg",
  },
});

export type keyboardButtonProps = VariantProps<typeof buttonVariants> & {
  key: string;
  class?: string;
};

export function KeyboardButton(props: keyboardButtonProps) {
  const [local] = splitProps(props as keyboardButtonProps, ["class", "size", "type"]);
  const keyType = () => (isModKey(props.key) && platform() === "macos" ? "mod" : "default");

  return (
    <div
      class={cn(
        buttonVariants({
          size: local.size,
          type: local.type ?? keyType(),
        }),
        local.class,
      )}
    >
      <kbd class="text-accent-foreground">{displayKey(props.key)}</kbd>
    </div>
  );
}

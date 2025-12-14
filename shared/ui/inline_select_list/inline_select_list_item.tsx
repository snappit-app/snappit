import { createMemo, JSX, onCleanup, onMount } from "solid-js";

import { cn } from "@/shared/libs/cn";

import { useInlineSelectList } from "./inline_select_list";

export interface InlineSelectListItemProps {
  value: string;
  label: string;
  children: JSX.Element;
  class?: string;
  disabled?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
}

export function InlineSelectListItem(props: InlineSelectListItemProps) {
  let ref: HTMLDivElement | undefined;
  const context = useInlineSelectList();

  const isActive = createMemo(() => context.activeValue() === props.value);

  onMount(() => {
    if (ref) {
      context.registerItem(props.value, props.label, ref);
    }
  });

  onCleanup(() => {
    context.unregisterItem(props.value);
  });

  const handleClick = () => {
    if (props.disabled) return;
    props.onClick?.();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (props.disabled) return;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      props.onClick?.();
    }

    props.onKeyDown?.(event);
  };

  const handleFocus = () => {
    context.setActiveValue(props.value);
  };

  return (
    <div
      ref={ref}
      tabIndex={props.disabled ? -1 : 0}
      role="option"
      class={cn(
        "flex items-center w-full relative py-1 px-2 rounded-sm group hover:bg-muted/40 focus:outline-none focus:bg-muted/40 focus-visible:bg-muted/40",
        props.disabled && "opacity-50 cursor-not-allowed",
        props.class,
      )}
      aria-selected={isActive()}
      aria-disabled={props.disabled}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </div>
  );
}

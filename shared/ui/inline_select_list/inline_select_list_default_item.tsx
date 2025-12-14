import { JSX } from "solid-js";

import { cn } from "@/shared/libs/cn";

import { useInlineSelectList } from "./inline_select_list";

export interface InlineSelectListDefaultItemProps {
  children: JSX.Element;
  class?: string;
  selected?: boolean;
}

export function InlineSelectListDefaultItem(props: InlineSelectListDefaultItemProps) {
  const context = useInlineSelectList();

  const handleClick = () => {
    context.onSelectDefault();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      context.onSelectDefault();
    }
  };

  return (
    <div
      tabIndex={0}
      role="option"
      class={cn(
        "flex items-center w-full relative py-1 px-2 rounded-sm cursor-default hover:bg-muted/40 focus:outline-none focus:bg-muted/40 focus-visible:bg-muted/40",
        props.selected && "bg-muted",
        props.class,
      )}
      aria-selected={props.selected}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </div>
  );
}

import { JSX } from "solid-js";

import { cn } from "@/shared/libs/cn";

export interface InlineSelectListContentProps {
  children: JSX.Element;
  class?: string;
}

export function InlineSelectListContent(props: InlineSelectListContentProps) {
  return <div class={cn("flex-1 overflow-auto", props.class)}>{props.children}</div>;
}

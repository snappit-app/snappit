import { JSX } from "solid-js";

import { cn } from "@/shared/libs/cn";

export interface InlineSelectListHeaderProps {
  children: JSX.Element;
  class?: string;
}

export function InlineSelectListHeader(props: InlineSelectListHeaderProps) {
  return <div class={cn("flex-shrink-0", props.class)}>{props.children}</div>;
}

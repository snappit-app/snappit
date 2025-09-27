import { children } from "solid-js";
import { JSX } from "solid-js";

import { cn } from "@/shared/libs/cn";

export type overlayProps = {
  class?: string;
  children?: JSX.Element;
};

export function Overlay(props: overlayProps) {
  const c = children(() => props.children);
  return (
    <div
      class={cn("h-full w-full relative bg-transparent overflow-hidden scroll-none", props.class)}
    >
      {c()}
    </div>
  );
}

export function StaticBackdrop(props: overlayProps) {
  return <div class={cn("fixed inset-0 bg-backdrop", props.class)} />;
}

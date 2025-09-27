import { Accessor, children, createMemo, JSX, splitProps } from "solid-js";

import { cn } from "@/shared/libs/cn";

export type portalPos = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type portalProps = {
  pos: Accessor<portalPos>;
  children?: JSX.Element;
  class?: string;
  innerClass?: string;
  innerStyles?: JSX.CSSProperties;
};

export function OverlayPortal(props: portalProps) {
  const [local, rest] = splitProps(props, ["class", "innerClass", "innerStyles"]);
  const c = children(() => props.children);

  const selectionRect = createMemo(() => {
    const p = rest.pos();
    return {
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.width}px`,
      height: `${p.height}px`,
    };
  });

  return (
    <div class={cn("absolute pointer-events-none", local.class)} style={selectionRect()}>
      <div
        class={cn("absolute inset-0 shadow-[0_0_0_9999px_var(--color-backdrop)]", local.innerClass)}
        style={local.innerStyles}
      />
      {c()}
    </div>
  );
}

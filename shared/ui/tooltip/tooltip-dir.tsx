// src/directives/tooltip.tsx
import { createEventListener } from "@solid-primitives/event-listener";
import { type Accessor, createSignal, JSX, onCleanup } from "solid-js";
import { render } from "solid-js/web";

import { cn } from "@/shared/libs/cn";

import { Tooltip } from "./tooltip";

export type TooltipParams = string | { content: JSX.Element | string; offset?: number };

export function tooltip(el: HTMLElement, accessor: Accessor<TooltipParams>) {
  const [visible, setVisible] = createSignal(false);
  const [left, setLeft] = createSignal(0);
  const [top, setTop] = createSignal(0);
  const [appeared, setAppeared] = createSignal(false);
  let tooltipRef: HTMLDivElement | undefined;
  let showTimer: number | undefined;

  const getContent = () => {
    const v = accessor();
    return typeof v === "string" ? v : v.content;
  };
  const getOffset = () => {
    const v = accessor();
    return typeof v === "string" ? 12 : (v.offset ?? 12);
  };

  const container = document.createElement("div");
  document.body.appendChild(container);

  const dispose = render(
    () => (
      <>
        {visible() && (
          <div
            ref={(el) => (tooltipRef = el)}
            class="z-50"
            style={{
              position: "fixed",
              left: `${left()}px`,
              top: `${top()}px`,
              "pointer-events": "none",
            }}
          >
            <Tooltip
              class={cn(
                "transition ease-out duration-150",
                appeared() ? "opacity-100 scale-100" : "opacity-0 scale-95",
              )}
            >
              {getContent()}
            </Tooltip>
          </div>
        )}
      </>
    ),
    container,
  );

  const updatePosition = () => {
    const rect = el.getBoundingClientRect();
    const o = getOffset();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tw = tooltipRef?.offsetWidth ?? 0;
    const th = tooltipRef?.offsetHeight ?? 0;

    let computedTop = rect.top - th - o;
    if (computedTop < 0) computedTop = rect.bottom + o;

    let computedLeft = rect.left + rect.width / 2 - tw / 2;
    const margin = 8;
    computedLeft = Math.max(margin, Math.min(computedLeft, vw - tw - margin));
    computedTop = Math.max(margin, Math.min(computedTop, vh - th - margin));

    setLeft(Math.round(computedLeft));
    setTop(Math.round(computedTop));
  };

  const onEnter = () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    showTimer = window.setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        updatePosition();
        requestAnimationFrame(() => {
          updatePosition();
          setAppeared(true);
        });
      });
    }, 500);
  };
  const onLeave = () => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    setVisible(false);
    setAppeared(false);
  };

  createEventListener(el, "mouseenter", onEnter);
  createEventListener(el, "mouseleave", onLeave);
  createEventListener(window, "resize", () => visible() && updatePosition());
  createEventListener(window, "scroll", () => visible() && updatePosition());

  onCleanup(() => {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    dispose();
    container.remove();
  });
}

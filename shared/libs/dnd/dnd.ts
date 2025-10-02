import { createEventListener } from "@solid-primitives/event-listener";
import { Accessor, createSignal, onMount } from "solid-js";

type Point = { x: number; y: number };

export type DndOptions = {
  clampToWindow?: boolean;
  initialPosition?: Point | "bottomCenter";
};

export type DndInstance = {
  setEl: (el: HTMLElement | undefined) => void;
  pos: Accessor<Point>;
  onHandlePointerDown: (e: PointerEvent) => void;
};

export function createDnd(options: DndOptions = {}): DndInstance {
  const { clampToWindow = true, initialPosition = "bottomCenter" } = options;

  let el: HTMLElement | undefined;

  const [dragging, setDragging] = createSignal(false);
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const [pos, setPos] = createSignal<Point>({ x: 0, y: 0 });

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const clampPoint = (x: number, y: number): Point => {
    if (!clampToWindow) return { x, y };
    const w = el?.offsetWidth ?? 0;
    const h = el?.offsetHeight ?? 0;
    const maxX = Math.max(0, window.innerWidth - w);
    const maxY = Math.max(0, window.innerHeight - h);
    return { x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging()) return;
    const nx = e.clientX - dragOffsetX;
    const ny = e.clientY - dragOffsetY;
    setPos(clampPoint(nx, ny));
  };

  const onPointerUp = () => {
    if (!dragging()) return;
    setDragging(false);
  };

  const onHandlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    setDragging(true);
  };

  const setEl = (node: HTMLElement | undefined) => {
    el = node;
  };

  const positionInitially = () => {
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let startX = 0;
    let startY = 0;
    if (initialPosition === "bottomCenter") {
      startX = Math.round(window.innerWidth / 2 - rect.width / 2);
      startY = Math.round(window.innerHeight * 0.95 - rect.height);
    } else if (initialPosition) {
      startX = initialPosition.x;
      startY = initialPosition.y;
    }
    setPos(clampPoint(startX, startY));
  };

  const reclamp = () => {
    const p = pos();
    setPos(clampPoint(p.x, p.y));
  };

  createEventListener(window, "resize", positionInitially);

  const dragTarget = () => (dragging() ? window : undefined);
  createEventListener(dragTarget, "pointermove", onPointerMove, { passive: true });
  createEventListener(dragTarget, "pointerup", onPointerUp);

  onMount(() => {
    positionInitially();
  });

  return { setEl, pos, onHandlePointerDown };
}

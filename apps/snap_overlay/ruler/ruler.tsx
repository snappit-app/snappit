import { createEventListener } from "@solid-primitives/event-listener";
import { createMemo, createSignal, Show } from "solid-js";

import { ScreenMagnifier } from "@/apps/snap_overlay/screen_magnifier";
import { TEXT_SNAP_CONSTS } from "@/shared/constants";

type Point = { x: number; y: number };

const ratio = TEXT_SNAP_CONSTS.store.color_dropper.magnify_ratio;

export function Ruler() {
  const [startPoint, setStartPoint] = createSignal<Point | null>(null);
  const [endPoint, setEndPoint] = createSignal<Point | null>(null);
  const [cursorPoint, setCursorPoint] = createSignal<Point | null>(null);

  const activeEndPoint = createMemo<Point | null>(() => endPoint() ?? cursorPoint());

  const measurement = createMemo(() => {
    const from = startPoint();
    const to = activeEndPoint();

    if (!from || !to) {
      return { length: 0, angle: 0, midpoint: null as Point | null, from: null, to: null };
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const midpoint = { x: from.x + dx / 2, y: from.y + dy / 2 };

    return { length, angle, midpoint, from, to };
  });

  createEventListener(window, "mousemove", (event: MouseEvent) => {
    setCursorPoint({ x: event.clientX, y: event.clientY });
  });

  createEventListener(window, "mousedown", (event: MouseEvent) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const point = { x: event.clientX, y: event.clientY };

    if (!startPoint() || endPoint()) {
      setStartPoint(point);
      setEndPoint(null);
      setCursorPoint(point);
      return;
    }

    setEndPoint(point);
  });

  return (
    <>
      <div class="absolute bottom-4 right-4 z-50 transition-[opacity] duration-200 ease-in-out hover:opacity-35">
        <div class="bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border pointer-events-none">
          <div class="relative">
            <div
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-black outline outline-2 outline-white"
              style={{
                width: `${ratio}px`,
                height: `${ratio}px`,
              }}
            />
            <ScreenMagnifier />
          </div>
        </div>
      </div>

      <Show when={startPoint() && activeEndPoint()}>
        <MeasurementOverlay
          start={measurement().from!}
          end={measurement().to!}
          length={measurement().length}
          angle={measurement().angle}
          midpoint={measurement().midpoint!}
        />
      </Show>
    </>
  );
}

function MeasurementOverlay(props: {
  start: Point;
  end: Point;
  length: number;
  angle: number;
  midpoint: Point;
}) {
  const labelPosition = createMemo<Point>(() => {
    const offset = 28;

    if (props.length === 0) {
      return { x: props.midpoint.x + offset, y: props.midpoint.y - offset };
    }

    const perpendicularAngle = props.angle + Math.PI / 2;

    return {
      x: props.midpoint.x + Math.cos(perpendicularAngle) * offset,
      y: props.midpoint.y + Math.sin(perpendicularAngle) * offset,
    };
  });

  return (
    <div class="pointer-events-none fixed inset-0">
      <div
        class="absolute"
        data-line
        style={{
          left: `${props.start.x}px`,
          top: `${props.start.y}px`,
        }}
      >
        <div
          class="origin-left bg-primary"
          style={{
            width: `${props.length}px`,
            height: "1px",
            transform: `translateY(-0.5px) rotate(${props.angle}rad)`,
          }}
        />
      </div>

      <div
        data-start
        class="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${props.start.x}px`,
          top: `${props.start.y}px`,
        }}
      >
        <div class="w-1 h-1 rounded-full bg-primary" />
      </div>

      <div
        data-end
        class="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${props.end.x}px`,
          top: `${props.end.y}px`,
        }}
      >
        <div class="w-1 h-1 rounded-full bg-primary" />
      </div>

      <div
        class="absolute"
        style={{
          left: `${labelPosition().x}px`,
          top: `${labelPosition().y}px`,
        }}
      >
        <div class="-translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded bg-card/90 border shadow text-xs font-medium text-foreground whitespace-nowrap">
          {Math.round(props.length)} px
        </div>
      </div>
    </div>
  );
}

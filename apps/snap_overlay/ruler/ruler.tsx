import { createEventListener } from "@solid-primitives/event-listener";
import { createMemo, createSignal, Show } from "solid-js";

import { onRulerSuccess } from "@/apps/snap_overlay/ruler/on_success";
import { createScreenMagnifier, ScreenMagnifier } from "@/apps/snap_overlay/screen_magnifier";
import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnapOverlayApi } from "@/shared/tauri/snap_overlay_api";
import { KeyboardButton } from "@/shared/ui/keyboard_button";

type Point = { x: number; y: number };
type AxisLock = "x" | "y" | null;

function resolveAxisLock(start: Point, target: Point): AxisLock {
  const dx = target.x - start.x;
  const dy = target.y - start.y;

  if (dx === 0 && dy === 0) {
    return null;
  }

  return Math.abs(dy) <= Math.abs(dx) ? "y" : "x";
}

const ratio = SNAPPIT_CONSTS.defaults.color_dropper.magnify_ratio;

export function Ruler() {
  const magnifierSrc = createScreenMagnifier();
  const [startPoint, setStartPoint] = createSignal<Point | null>(null);
  const [endPoint, setEndPoint] = createSignal<Point | null>(null);
  const [cursorPoint, setCursorPoint] = createSignal<Point | null>(null);
  const [isShiftPressed, setIsShiftPressed] = createSignal(false);

  const axisLock = createMemo<AxisLock>(() => {
    const start = startPoint();
    const target = endPoint() ?? cursorPoint();

    if (!isShiftPressed() || !start || !target) {
      return null;
    }

    return resolveAxisLock(start, target);
  });

  const activeEndPoint = createMemo<Point | null>(() => {
    const start = startPoint();
    const target = endPoint() ?? cursorPoint();

    if (!target) {
      return null;
    }

    const lockedAxis = start ? axisLock() : null;

    if (!start || !lockedAxis) {
      return target;
    }

    return lockedAxis === "y" ? { x: target.x, y: start.y } : { x: start.x, y: target.y };
  });

  const measurement = createMemo(() => {
    const from = startPoint();
    const to = activeEndPoint();

    if (!from || !to) {
      return { length: 0, angle: 0, midpoint: null as Point | null, from: null, to: null };
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);

    // Add 1 to include both end pixels (fence post correction)
    // For axis-aligned lines: use |dx| + 1 or |dy| + 1
    // For diagonal lines: use Chebyshev distance + 1 (max of |dx|, |dy|) for pixel counting
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const length = absDx === 0 || absDy === 0 ? absDx + absDy + 1 : Math.hypot(dx, dy) + 1;
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

    let point = { x: event.clientX, y: event.clientY };

    if (!startPoint() || endPoint()) {
      setStartPoint(point);
      setEndPoint(null);
      setCursorPoint(point);
      return;
    }

    const start = startPoint();

    if (start) {
      const lockedAxis = isShiftPressed() ? resolveAxisLock(start, point) : null;

      if (lockedAxis === "y") {
        point = { x: point.x, y: start.y };
      }

      if (lockedAxis === "x") {
        point = { x: start.x, y: point.y };
      }
    }

    setEndPoint(point);
    setCursorPoint(point);
  });

  createEventListener(window, "keydown", async (event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setIsShiftPressed(true);
    }

    if (event.key === "Enter") {
      const { length } = measurement();

      if (length > 0) {
        event.preventDefault();
        const text = `${Math.round(length).toString()}px`;
        await onRulerSuccess(text);
        await SnapOverlayApi.hide();
      }
    }
  });

  createEventListener(window, "keyup", (event: KeyboardEvent) => {
    if (event.key === "Shift") {
      setIsShiftPressed(false);
    }
  });

  return (
    <>
      <Show when={magnifierSrc()}>
        {(src) => (
          <div class="absolute bottom-4 right-4 z-50 transition-[opacity] duration-200 ease-in-out hover:opacity-35">
            <div class="bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border pointer-events-none ">
              <div class="mb-2 relative">
                <div
                  class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-black outline outline-2 outline-white"
                  style={{
                    width: `${ratio}px`,
                    height: `${ratio}px`,
                  }}
                />
                <ScreenMagnifier src={src} />
              </div>

              <div class="space-y-1">
                <div>
                  <div class="text-muted-foreground text-xs flex items-center justify-between mb-1">
                    Measure
                    <svg
                      class="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      height="1em"
                      width="1em"
                      style={{ overflow: "visible" }}
                    >
                      <path d="M5 8v2h6V2C7.691 2 5 4.691 5 8z" fill="white" />
                      <path
                        d="M13 2v8h6V8c0-3.309-2.691-6-6-6zM5 16c0 3.309 2.691 6 6 6h2c3.309 0 6-2.691 6-6v-4H5v4z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div class="text-muted-foreground text-xs flex items-center justify-between mb-1">
                    Copy
                    <KeyboardButton key="Enter" type={"default"} size={"xs"} />
                  </div>
                  <div class="text-muted-foreground text-xs flex items-center justify-between">
                    Lock axis <KeyboardButton key="Shift" type={"default"} size={"xs"} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Show>

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
      {/* Line with contrast: white outline + primary stroke */}
      <svg
        class="absolute inset-0 w-full h-full overflow-visible"
        style={{ "pointer-events": "none" }}
      >
        {/* White outline for contrast */}
        <line
          x1={props.start.x}
          y1={props.start.y}
          x2={props.end.x}
          y2={props.end.y}
          stroke="white"
          stroke-width="1"
          stroke-linecap="round"
        />
        {/* Black outline for contrast */}
        <line
          x1={props.start.x}
          y1={props.start.y}
          x2={props.end.x}
          y2={props.end.y}
          stroke="black"
          stroke-width="2"
          stroke-linecap="round"
        />
        {/* Primary color line */}
        <line
          x1={props.start.x}
          y1={props.start.y}
          x2={props.end.x}
          y2={props.end.y}
          class="stroke-primary"
          stroke-width="1"
          stroke-linecap="round"
        />
      </svg>

      {/* Start point with contrast */}
      <svg
        class="absolute overflow-visible"
        style={{
          left: `${props.start.x}px`,
          top: `${props.start.y}px`,
          width: "1px",
          height: "1px",
        }}
      >
        <circle cx="0" cy="0" r="4" fill="white" />
        <circle cx="0" cy="0" r="3" fill="black" />
        <circle cx="0" cy="0" r="2" class="fill-primary" />
      </svg>

      {/* End point with contrast */}
      <svg
        class="absolute overflow-visible"
        style={{
          left: `${props.end.x}px`,
          top: `${props.end.y}px`,
          width: "1px",
          height: "1px",
        }}
      >
        <circle cx="0" cy="0" r="4" fill="white" />
        <circle cx="0" cy="0" r="3" fill="black" />
        <circle cx="0" cy="0" r="2" class="fill-primary" />
      </svg>

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

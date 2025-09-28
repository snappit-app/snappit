import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";

import { qrFrame } from "@/apps/snap_overlay/qr-scan/lib/models";
import { clamp } from "@/shared/libs/clamp";
import { OverlayPortal, portalPos } from "@/shared/ui/overlay";

export function QrScanner(props: { frame: Accessor<qrFrame> }) {
  const pos = createMemo<portalPos>(() => ({
    width: props.frame().size,
    height: props.frame().size,
    x: props.frame().center.x - props.frame().size / 2,
    y: props.frame().center.y - props.frame().size / 2,
  }));

  const borderWidth = createMemo(() => clamp(Math.round(props.frame().size / 48), 4, 8));

  const arcPaths = createMemo(() => {
    const { size } = props.frame();
    const stroke = borderWidth();
    const radiusMax = Math.max(size / 2 - stroke, stroke);
    const radius = Math.max(Math.min(size * 0.12, radiusMax), stroke);
    const inset = stroke / 4;

    const h = stroke / 2;
    const i = inset;

    const topLeft = `M ${i + radius} ${i - h} A ${radius} ${radius} 0 0 0 ${i - h} ${i + radius}`;
    const topRight = `M ${size - i - radius} ${i - h} A ${radius} ${radius} 0 0 1 ${size - i + h} ${i + radius}`;
    const bottomLeft = `M ${i - h} ${size - i - radius} A ${radius} ${radius} 0 0 0 ${i + radius} ${size - i + h}`;
    const bottomRight = `M ${size - i + h} ${size - i - radius} A ${radius} ${radius} 0 0 1 ${size - i - radius} ${size - i + h}`;

    return {
      size,
      paths: [topLeft, topRight, bottomLeft, bottomRight],
    };
  });

  return (
    <OverlayPortal pos={pos} class="animate-qr-pulse" innerClass="rounded-[12%]">
      <svg
        class="overflow-visible"
        viewBox={`0 0 ${arcPaths().size} ${arcPaths().size}`}
        xmlns="http://www.w3.org/2000/svg"
        stroke="white"
        stroke-width={borderWidth()}
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
        filter="url(#cornerShadow)"
      >
        <defs>
          <filter id="cornerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" flood-color="black" flood-opacity="0.6" />
          </filter>
        </defs>
        <For each={arcPaths().paths}>{(d) => <path d={d} />}</For>
      </svg>
    </OverlayPortal>
  );
}

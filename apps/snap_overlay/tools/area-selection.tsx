import { Accessor, createMemo } from "solid-js";

import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";

export function AreaSelection(props: { selection: Accessor<RegionCaptureParams> }) {
  const selectionRect = createMemo(() => {
    const p = props.selection();
    return {
      left: `${p.x}px`,
      top: `${p.y}px`,
      width: `${p.width}px`,
      height: `${p.height}px`,
    };
  });

  const overlaySlices = createMemo(() => {
    const p = props.selection();
    const x = p.x;
    const y = p.y;
    const w = p.width;
    const h = p.height;

    return {
      top: {
        left: "0px",
        top: "0px",
        right: "0px",
        height: `${y}px`,
      },
      left: {
        left: "0px",
        top: `${y}px`,
        width: `${x}px`,
        height: `${h}px`,
      },
      right: {
        left: `${x + w}px`,
        right: "0px",
        top: `${y}px`,
        height: `${h}px`,
      },
      bottom: {
        left: "0px",
        right: "0px",
        top: `${y + h}px`,
        bottom: "0px",
      },
    };
  });

  return (
    <>
      <div class="absolute bg-black opacity-50" style={overlaySlices().top} />
      <div class="absolute bg-black opacity-50" style={overlaySlices().left} />
      <div class="absolute bg-black opacity-50" style={overlaySlices().right} />
      <div class="absolute bg-black opacity-50" style={overlaySlices().bottom} />
      <div class="absolute pointer-events-none border-1 border-white" style={selectionRect()} />
    </>
  );
}

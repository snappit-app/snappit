import { createEventListener } from "@solid-primitives/event-listener";
import { createMemo, createSignal } from "solid-js";

import { RegionCaptureParams } from "@/shared/tauri/region_capture_api";

const DEFAULT_POS = { x: 0, y: 0 };

export function createSelection(onSelected?: (selection: RegionCaptureParams) => unknown) {
  const [isSelecting, setIsSelecting] = createSignal(false);
  const [startPos, setStartPos] = createSignal(DEFAULT_POS);
  const [currentPos, setCurrentPos] = createSignal(DEFAULT_POS);

  const selection = createMemo<RegionCaptureParams>(() => ({
    x: Math.min(startPos().x, currentPos().x),
    y: Math.min(startPos().y, currentPos().y),
    width: Math.abs(currentPos().x - startPos().x),
    height: Math.abs(currentPos().y - startPos().y),
  }));

  const onSelectionStart = (e: MouseEvent) => {
    if (e.button === 0) {
      setIsSelecting(true);
      setStartPos({ x: e.clientX, y: e.clientY });
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = async (e: MouseEvent) => {
    if (!isSelecting()) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isSelecting()) {
      return;
    }

    if (e.button === 0) {
      setIsSelecting(false);
      if (onSelected) {
        onSelected(selection());
      }
      setStartPos(DEFAULT_POS);
      setCurrentPos(DEFAULT_POS);
    }
  };

  createEventListener(window, "mousemove", handleMouseMove);
  createEventListener(window, "mouseup", handleMouseUp);

  return [selection, isSelecting, onSelectionStart] as const;
}

import { createResizeObserver } from "@solid-primitives/resize-observer";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { Accessor } from "solid-js";

export function autoResizeWindow(container: Accessor<HTMLDivElement | null | undefined>) {
  const appWindow = getCurrentWindow();

  let lastSetHeight = 0;

  const updateHeight = async (height: number) => {
    if (height <= 0 || height === lastSetHeight) {
      return;
    }

    lastSetHeight = height;

    const scaleFactor = await appWindow.scaleFactor();
    const physicalSize = await appWindow.innerSize();
    const logicalSize = physicalSize.width / scaleFactor;
    await appWindow.setSize(new LogicalSize(logicalSize, height));
  };

  createResizeObserver(container, (rect) => {
    updateHeight(rect.height);
  });
}

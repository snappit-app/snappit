import { createEventListener } from "@solid-primitives/event-listener";

export function clickOutside(el: HTMLElement, accessor: () => (e: MouseEvent) => void) {
  const handler = (e: MouseEvent) => {
    if (!el.contains(e.target as Node)) {
      accessor()?.(e);
    }
  };

  createEventListener(document, "click", handler);
}

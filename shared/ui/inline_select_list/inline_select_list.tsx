import { createEventListener } from "@solid-primitives/event-listener";
import { BsQuestionCircleFill } from "solid-icons/bs";
import {
  Accessor,
  createContext,
  createEffect,
  createSignal,
  JSX,
  Show,
  useContext,
} from "solid-js";

import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

export interface InlineSelectListContextValue {
  activeValue: Accessor<string | null>;
  setActiveValue: (value: string | null) => void;
  registerItem: (value: string, label: string, ref: HTMLElement) => void;
  unregisterItem: (value: string) => void;
  focusItem: (value: string) => void;
  onSelectDefault: () => void;
}

const InlineSelectListContext = createContext<InlineSelectListContextValue>();

export function useInlineSelectList() {
  const context = useContext(InlineSelectListContext);
  if (!context) {
    throw new Error("useInlineSelectList must be used within InlineSelectList");
  }
  return context;
}

export interface InlineSelectListProps {
  children: JSX.Element;
  class?: string;
  "aria-label"?: string;
  typeaheadResetMs?: number;
  hint?: string;
  onSelectDefault?: () => void;
}

export function InlineSelectList(props: InlineSelectListProps) {
  const [activeValue, setActiveValue] = createSignal<string | null>(null);
  const [typeaheadQuery, setTypeaheadQuery] = createSignal("");

  const itemRefs = new Map<string, HTMLElement>();
  const itemLabels = new Map<string, string>();
  let lastTypeAt = 0;
  const TYPEAHEAD_RESET_MS = props.typeaheadResetMs ?? 1000;

  const registerItem = (value: string, label: string, ref: HTMLElement) => {
    itemRefs.set(value, ref);
    itemLabels.set(value, label);
  };

  const unregisterItem = (value: string) => {
    itemRefs.delete(value);
    itemLabels.delete(value);
  };

  const focusItem = (value: string) => {
    setActiveValue(value);
    const element = itemRefs.get(value);
    if (element) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "center" });
    }
  };

  const findMatch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setActiveValue(null);
      return;
    }

    let match: string | null = null;
    let startWithMatch: string | null = null;

    for (const [value, label] of itemLabels.entries()) {
      const labelLower = label.toLowerCase();
      const valueLower = value.toLowerCase();

      if (labelLower.includes(normalized) || valueLower.includes(normalized)) {
        if (!match) match = value;
      }
      if (labelLower.startsWith(normalized)) {
        if (!startWithMatch) startWithMatch = value;
      }
    }

    if (match) {
      focusItem(startWithMatch ?? match);
      return;
    }

    setActiveValue(null);
  };

  createEffect(() => {
    const currentActive = activeValue();
    if (!currentActive) return;

    if (!itemLabels.has(currentActive)) {
      setActiveValue(null);
    }
  });

  const handleTypeahead = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, button")) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === "Escape") {
      setTypeaheadQuery("");
      setActiveValue(null);
      return;
    }

    if (event.key === "Backspace") {
      const nextQuery = typeaheadQuery().slice(0, -1);
      setTypeaheadQuery(nextQuery);
      if (!nextQuery) {
        setActiveValue(null);
        return;
      }
      findMatch(nextQuery);
      return;
    }

    if (event.key.length === 1) {
      const now = Date.now();
      const baseQuery = now - lastTypeAt > TYPEAHEAD_RESET_MS ? "" : typeaheadQuery();
      lastTypeAt = now;
      const nextQuery = (baseQuery + event.key).toLowerCase();
      setTypeaheadQuery(nextQuery);
      findMatch(nextQuery);
    }
  };

  createEventListener(window, "keydown", handleTypeahead);

  const handleSelectDefault = () => {
    props.onSelectDefault?.();
  };

  const contextValue: InlineSelectListContextValue = {
    activeValue,
    setActiveValue,
    registerItem,
    unregisterItem,
    focusItem,
    onSelectDefault: handleSelectDefault,
  };

  return (
    <InlineSelectListContext.Provider value={contextValue}>
      <div
        class={props.class ?? "flex flex-col gap-1"}
        role="listbox"
        aria-label={props["aria-label"] ?? "Select list. Type to search."}
      >
        <Show when={props.hint}>
          <div class="flex justify-end px-4 pb-1">
            <div use:tooltip={props.hint} class="text-muted-foreground">
              <BsQuestionCircleFill size={14} />
            </div>
          </div>
        </Show>
        {props.children}
      </div>
    </InlineSelectListContext.Provider>
  );
}

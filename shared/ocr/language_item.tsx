import { FiDownload, FiTrash2 } from "solid-icons/fi";
import { Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { RecognitionLanguageOption } from "@/shared/ocr/recognition_language";
import { Checkbox, CheckboxControl } from "@/shared/ui/checkbox";

import { Tag } from "../ui/tag";

interface LanguageItemProps {
  option: RecognitionLanguageOption;
  isInstalled: boolean;
  isDownloading: boolean;
  isSelected: boolean;
  isSystem: boolean;
  canDelete: boolean;
  isActive?: boolean;
  itemRef?: (el: HTMLDivElement) => void;
  onFocusItem?: () => void;
  onToggle: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function LanguageItem(props: LanguageItemProps) {
  return (
    <div
      ref={props.itemRef}
      tabIndex={0}
      role="option"
      class={cn(
        "flex items-center w-full relative py-1 px-4 rounded-sm group  hover:bg-muted focus:outline-none focus:bg-muted focus-visible:bg-muted",
      )}
      aria-selected={props.isActive}
      onClick={() => {
        if (props.isInstalled) {
          props.onToggle();
        } else if (!props.isDownloading) {
          props.onDownload();
        }
      }}
      onFocus={() => props.onFocusItem?.()}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          if (props.isInstalled) {
            props.onToggle();
          } else if (!props.isDownloading) {
            props.onDownload();
          }
        }
      }}
    >
      <div class="flex items-center grow gap-2">
        <span class="text-sm font-medium leading-none py-1">{props.option.label}</span>

        <Show when={props.isInstalled && props.canDelete}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onDelete();
            }}
            class="text-muted-foreground  hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1"
            title="Delete language"
          >
            <FiTrash2 size={14} />
          </button>
        </Show>

        <Show when={props.isInstalled && props.isSystem && !props.canDelete}>
          <Tag>SYSTEM</Tag>
        </Show>
      </div>

      <Show when={!props.isInstalled && !props.isDownloading}>
        <FiDownload size={16} />
      </Show>

      <Show when={props.isDownloading}>
        <div class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      </Show>

      <Show when={props.isInstalled}>
        <Checkbox
          class="flex items-center"
          checked={props.isSelected}
          onChange={props.onToggle}
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          <CheckboxControl color={"product"} />
        </Checkbox>
      </Show>
    </div>
  );
}

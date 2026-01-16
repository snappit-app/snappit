import { BsQuestionCircleFill } from "solid-icons/bs";
import { createMemo } from "solid-js";

import { tooltip } from "@/shared/ui/tooltip";

import { isMacOS, systemLanguagesInfo } from "./installed_languages";

void tooltip;

export interface SystemLanguageButtonProps {
  isSelected: boolean;
  onSelect: () => void;
}

export function SystemLanguageButton(props: SystemLanguageButtonProps) {
  const systemLanguageNames = createMemo(() => {
    const info = systemLanguagesInfo();
    if (info.length === 0) {
      return "No system languages detected";
    }
    return info.map((l) => l.name).join(", ");
  });

  const autoModeHint = createMemo(() => {
    const info = systemLanguagesInfo();
    if (info.length === 0) {
      return "Uses system-detected languages for OCR recognition";
    }

    const languageNames = info.map((l) => l.name).join(", ");

    if (isMacOS()) {
      return `Uses macOS Vision with: ${languageNames}`;
    }

    return `Uses system languages: ${languageNames}`;
  });

  return (
    <button
      class="p-3 flex flex-col items-start text-accent-foreground w-full rounded-md active:brightness-90"
      classList={{
        "bg-product/20": props.isSelected,
        "bg-muted": !props.isSelected,
      }}
      onClick={() => props.onSelect()}
    >
      <div class="text-md flex justify-between w-full items-center">
        System
        <div class="flex gap-3 items-center">
          <div use:tooltip={autoModeHint()} class="text-muted-foreground text-xs">
            <BsQuestionCircleFill size={16} />
          </div>
        </div>
      </div>
      <div class="text-xs text-muted-foreground items-center gap-1">
        <span>{systemLanguageNames()}</span>
      </div>
    </button>
  );
}

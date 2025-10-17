import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { BsMagic } from "solid-icons/bs";
import { type Component, createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import { cn } from "@/shared/libs/cn";
import { createNotificationVisible } from "@/shared/libs/notification_visible";
import type { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";
import { Theme } from "@/shared/theme";

const ICON_MAP: Record<SnappitOverlayTarget, Component<{ size?: number }>> = {
  smart_tool: BsMagic,
  text_capture: BiRegularCopy,
  digital_ruler: BiSolidRuler,
  color_dropper: BiSolidEyedropper,
  qr_scanner: BiRegularQrScan,
  none: BsMagic,
};

function NotificationApp() {
  Theme.create();
  const [visible, target, payload] = createNotificationVisible();
  const [present, setPresent] = createSignal(visible());
  const [animationState, setAnimationState] = createSignal<"enter" | "exit">("exit");
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const IconComponent = createMemo(() => ICON_MAP[target() ?? "none"]);
  const message = createMemo(() => payload().trim());

  createEffect(() => {
    if (visible()) {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = undefined;
      }

      setPresent(true);
      setAnimationState("enter");
      return;
    }

    if (!present()) {
      return;
    }

    setAnimationState("exit");
    hideTimer = setTimeout(() => {
      setPresent(false);
      hideTimer = undefined;
    }, 200);
  });

  onCleanup(() => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  });

  return (
    <Show when={present()}>
      <div
        class={cn(
          "pointer-events-none flex h-full w-full flex-col items-center justify-center gap-5 rounded-3xl bg-background/70 text-center text-foreground backdrop-blur-xl duration-200",
          animationState() === "enter" && "animate-in fade-in-0 zoom-in-95",
          animationState() === "exit" && "animate-out fade-out-0 zoom-out-95",
        )}
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Dynamic component={IconComponent()} size={38} />
        </div>

        <p class="w-full text-sm font-medium leading-6 text-foreground opacity-90 break-words whitespace-pre-line">
          {message()}
        </p>
      </div>
    </Show>
  );
}

export default NotificationApp;

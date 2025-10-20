import { createTimer } from "@solid-primitives/timer";
import { BiRegularCopy, BiRegularQrScan, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import { BsMagic } from "solid-icons/bs";
import { Accessor, Component, createMemo, createSignal, Match, onMount, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";

import { cn } from "@/shared/libs/cn";
import { SnappitStore } from "@/shared/store";
import { NotificationApi } from "@/shared/tauri/notification_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

const ICON_MAP: Record<SnappitOverlayTarget, Component<{ size?: number }>> = {
  smart_tool: BsMagic,
  text_capture: BiRegularCopy,
  digital_ruler: BiSolidRuler,
  color_dropper: BiSolidEyedropper,
  qr_scanner: BiRegularQrScan,
  none: BsMagic,
};

type notificationProps = {
  payload: Accessor<string>;
  target: Accessor<SnappitOverlayTarget>;
  data: Accessor<string | undefined>;
};

const NOTIFICATION_LIFETIME = 1500;
const ANIMATION_TIMEOUT = 200;

export function NotificationItem(props: notificationProps) {
  const IconComponent = createMemo(() => ICON_MAP[props.target() ?? "none"]);
  const [animationState, setAnimationState] = createSignal<"enter" | "exit">("enter");

  onMount(async () => {
    await SnappitStore.sync();
  });

  createTimer(
    async () => {
      setAnimationState("exit");
    },
    NOTIFICATION_LIFETIME - ANIMATION_TIMEOUT,
    setTimeout,
  );

  createTimer(
    async () => {
      await NotificationApi.hide();
    },
    NOTIFICATION_LIFETIME,
    setTimeout,
  );

  return (
    <div
      class={cn(
        `pointer-events-none opacity-85 flex h-full w-full flex-col items-center justify-center gap-5 rounded-3xl bg-background text-center text-foreground backdrop-blur-xl`,
        animationState() === "enter" && "animate-in duration-200 fade-in-0 zoom-in-95",
        animationState() === "exit" && "animate-out duration-200 fade-out-0 zoom-out-95",
      )}
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Dynamic component={IconComponent()} size={38} />
      </div>

      <div class="text-lg font-bold text-foreground">
        <Switch fallback={<>Content copied</>}>
          <Match when={props.target() === "digital_ruler"}>Measurement copied</Match>
          <Match when={props.target() === "text_capture"}>Text copied</Match>
          <Match when={props.target() === "color_dropper"}>Color copied</Match>
          <Match when={props.target() === "qr_scanner"}>
            {props.data() === "on_url" ? "Link opened" : "Content copied"}
          </Match>
        </Switch>
      </div>

      <div class="text-sm w-[200px] text-foreground opacity-90 truncate">
        <Switch fallback={<>{props.payload()}</>}>
          <Match when={props.target() === "color_dropper"}>
            <div class="flex items-center justify-center gap-2">
              <div
                class="w-4 h-4 rounded border border-primary"
                style={{
                  "background-color": props.payload(),
                }}
              />
              <span class="text-sm font-mono text-foreground">{props.payload()}</span>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
}

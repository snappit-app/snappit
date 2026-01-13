import { makeTimer } from "@solid-primitives/timer";
import { BiRegularQrScan, BiSolidCopy, BiSolidEyedropper, BiSolidRuler } from "solid-icons/bi";
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  Match,
  on,
  onCleanup,
  Switch,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { cn } from "@/shared/libs/cn";
import { NotificationDurationSettings } from "@/shared/notifications";
import { SnappitStore } from "@/shared/store";
import { NotificationApi } from "@/shared/tauri/notification_api";
import { SnappitOverlayTarget } from "@/shared/tauri/snap_overlay_target";

const ICON_MAP: Record<SnappitOverlayTarget, Component<{ size?: number }>> = {
  capture: BiSolidCopy,
  digital_ruler: BiSolidRuler,
  color_dropper: BiSolidEyedropper,
  qr_scanner: BiRegularQrScan,
  none: BiSolidCopy,
};

type NotificationProps = {
  payload: Accessor<string>;
  target: Accessor<SnappitOverlayTarget>;
  data: Accessor<string | undefined>;
  notificationId: Accessor<number>;
};

const ANIMATION_DURATION_MS = 200;

export function NotificationItem(props: NotificationProps) {
  const IconComponent = createMemo(() => ICON_MAP[props.target() ?? "none"]);
  const [progress, setProgress] = createSignal(100);

  createEffect(
    on(props.notificationId, (currentId) => {
      setProgress(100);

      const cleanupFns: (() => void)[] = [];

      const cleanup = () => {
        cleanupFns.forEach((fn) => fn());
        cleanupFns.length = 0;
      };

      onCleanup(cleanup);

      (async () => {
        await SnappitStore.sync();
        const durationMs = await NotificationDurationSettings.getDurationMs();

        const startTime = Date.now();
        const clearProgress = makeTimer(
          () => {
            if (props.notificationId() !== currentId) {
              cleanup();
              return;
            }
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
            setProgress(remaining);
            if (remaining <= 0) {
              clearProgress();
            }
          },
          16,
          setInterval,
        );
        cleanupFns.push(clearProgress);

        // Start native exit animation before hiding
        const clearAnimateOut = makeTimer(
          async () => {
            if (props.notificationId() === currentId) {
              await NotificationApi.animateOut();
            }
          },
          durationMs - ANIMATION_DURATION_MS,
          setTimeout,
        );
        cleanupFns.push(clearAnimateOut);

        // Hide window after animation completes
        const clearHide = makeTimer(
          async () => {
            if (props.notificationId() === currentId) {
              cleanup();
              await NotificationApi.hide();
            }
          },
          durationMs,
          setTimeout,
        );
        cleanupFns.push(clearHide);
      })();
    }),
  );

  return (
    <div
      class={cn(
        `pointer-events-none opacity-85 flex h-full w-full flex-col items-center justify-center gap-5 rounded-4xl text-center text-foreground backdrop-blur-xl`,
      )}
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Dynamic component={IconComponent()} size={38} />
      </div>

      <div class="text-lg font-bold text-foreground">
        <Switch fallback={<>Text copied</>}>
          <Match when={props.target() === "digital_ruler"}>Measurement copied</Match>
          <Match when={props.target() === "color_dropper"}>Color copied</Match>
          <Match when={props.target() === "qr_scanner"}>
            {props.data() === "on_url" ? "Link opened" : "Content copied"}
          </Match>
        </Switch>
      </div>

      <div class="text-sm w-[240px] text-foreground opacity-90 truncate">
        <Switch fallback={<>{props.payload()}</>}>
          <Match when={props.target() === "color_dropper"}>
            <div class="flex items-center justify-center flex-wrap gap-2">
              <div
                class="w-4 h-4 rounded border border-primary"
                style={{
                  "background-color": props.data() || props.payload(),
                }}
              />
              <span class="text-sm font-mono text-foreground">{props.payload()}</span>
            </div>
          </Match>
        </Switch>
      </div>

      <div class="w-[200px]">
        <div class="h-1 w-full rounded-full bg-primary/20 overflow-hidden">
          <div class="h-full bg-primary transition-none" style={{ width: `${progress()}%` }} />
        </div>
      </div>
    </div>
  );
}

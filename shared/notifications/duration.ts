import { load } from "@tauri-apps/plugin-store";
import { createMemo } from "solid-js";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

export type NotificationDuration = "short" | "medium" | "long";

export const NOTIFICATION_DURATION_OPTIONS: {
  value: NotificationDuration;
  label: string;
  ms: number;
}[] = [
  { value: "short", label: "Short (1.5s)", ms: 1500 },
  { value: "medium", label: "Medium (2s)", ms: 2000 },
  { value: "long", label: "Long (3s)", ms: 3000 },
];

export const DEFAULT_NOTIFICATION_DURATION: NotificationDuration = "medium";
export const DEFAULT_NOTIFICATION_DURATION_MS = 2000;

type NotificationDurationPreference = readonly [
  () => NotificationDuration,
  (next: NotificationDuration) => void,
];

export abstract class NotificationDurationSettings {
  private static readonly KEY = SNAPPIT_CONSTS.store.keys.notification_duration;

  static create(): NotificationDurationPreference {
    const [storeValue, setStoreValue] = SnappitStore.createValue<NotificationDuration>(this.KEY);

    const duration = createMemo<NotificationDuration>(
      () => storeValue() ?? DEFAULT_NOTIFICATION_DURATION,
    );

    return [duration, setStoreValue];
  }

  static async getDurationMs(): Promise<number> {
    try {
      const store = await load(SNAPPIT_CONSTS.store.file);
      const value = await store.get<NotificationDuration>(this.KEY);
      const option = NOTIFICATION_DURATION_OPTIONS.find((o) => o.value === value);
      return option?.ms ?? DEFAULT_NOTIFICATION_DURATION_MS;
    } catch (err) {
      console.error(err);
      return DEFAULT_NOTIFICATION_DURATION_MS;
    }
  }

  static getDurationMsFromValue(value: NotificationDuration | null | undefined): number {
    const option = NOTIFICATION_DURATION_OPTIONS.find((o) => o.value === value);
    return option?.ms ?? DEFAULT_NOTIFICATION_DURATION_MS;
  }
}

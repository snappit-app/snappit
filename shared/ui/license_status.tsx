import { Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { SnappitLicense } from "@/shared/libs/license";

export interface LicenseStatusProps {
  class?: string;
}

export function LicenseStatus(props: LicenseStatusProps) {
  const [licenseState] = SnappitLicense.create();

  const isFull = () => SnappitLicense.isFull(licenseState());
  const usesRemaining = () => SnappitLicense.getUsesRemaining(licenseState());
  const isExpired = () => SnappitLicense.isTrialExpired(licenseState());
  const isLowUses = () => !isFull() && usesRemaining() <= 5 && usesRemaining() > 0;

  return (
    <div
      class={cn(
        "flex items-center gap-3 p-4 rounded-lg border",
        isExpired() && "border-destructive bg-destructive/10",
        isLowUses() && "border-warning bg-warning/10",
        !isExpired() && !isLowUses() && "border-border bg-card",
        props.class,
      )}
    >
      <div
        class={cn(
          "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
          isFull() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {isFull() ? "Full" : "Trial"}
      </div>

      <div class="flex-1">
        <Show when={isFull()}>
          <span class="text-sm font-medium text-foreground">Product activated</span>
        </Show>

        <Show when={!isFull() && !isExpired()}>
          <span
            class={cn(
              "text-sm font-medium",
              isLowUses() ? "text-warning-foreground" : "text-foreground",
            )}
          >
            {usesRemaining()} uses remaining
          </span>
          <Show when={isLowUses()}>
            <span class="text-xs text-muted-foreground ml-2">Running low!</span>
          </Show>
        </Show>

        <Show when={isExpired()}>
          <span class="text-sm font-medium text-destructive">Trial expired</span>
          <span class="text-xs text-muted-foreground ml-2">Upgrade to continue</span>
        </Show>
      </div>
    </div>
  );
}

import { FiEye, FiEyeOff } from "solid-icons/fi";
import { createSignal, onMount, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { SnappitLicense } from "@/shared/libs/license";
import {
  activateFullLicense,
  getLicenseKey,
  updateTrayLicenseStatus,
} from "@/shared/tauri/license_api";
import { Button } from "@/shared/ui/button";
import { LicenseStatus } from "@/shared/ui/license_status";

export function License() {
  const [licenseState, refetch] = SnappitLicense.create();
  const [licenseKey, setLicenseKey] = createSignal("");
  const [storedLicenseKey, setStoredLicenseKey] = createSignal<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = createSignal(false);
  const [isActivating, setIsActivating] = createSignal(false);
  const [activationError, setActivationError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const key = await getLicenseKey();
      setStoredLicenseKey(key);
    } catch (e) {
      console.error("Failed to get license key:", e);
    }
  });

  const isFull = () => SnappitLicense.isFull(licenseState());

  const maskLicenseKey = (key: string) => {
    if (key.length <= 4) return "*".repeat(key.length);
    return "*".repeat(key.length - 4) + key.slice(-4);
  };

  const handleActivate = async () => {
    const key = licenseKey().trim();
    if (!key) {
      setActivationError("Please enter a license key");
      return;
    }

    setIsActivating(true);
    setActivationError(null);

    try {
      await activateFullLicense(key);
      await updateTrayLicenseStatus();
      setStoredLicenseKey(key);
      setLicenseKey("");
      refetch();
    } catch (e) {
      console.error("Failed to activate license:", e);
      setActivationError("Failed to activate license. Please check your key and try again.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <LicenseStatus />

      <div class="bg-card rounded-lg p-3">
        <div class="mb-4">
          <h2 class="font-bold text-lg">About Your License</h2>
        </div>

        <div class="flex flex-col gap-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground">License Type</span>
            <span class="font-medium capitalize">{licenseState()?.licenseType ?? "—"}</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-muted-foreground">Uses Remaining</span>
            <span class="font-medium">
              {licenseState()?.licenseType === "full"
                ? "Unlimited"
                : (licenseState()?.usesRemaining ?? "—")}
            </span>
          </div>

          <Show when={isFull() && storedLicenseKey()}>
            <div class="flex justify-between items-center">
              <span class="text-muted-foreground">License Key</span>
              <div class="flex items-center gap-2">
                <span class="font-medium font-mono text-xs">
                  {isKeyVisible() ? storedLicenseKey() : maskLicenseKey(storedLicenseKey()!)}
                </span>
                <button
                  type="button"
                  class="p-1 rounded hover:bg-muted transition-colors"
                  onClick={() => setIsKeyVisible(!isKeyVisible())}
                  aria-label={isKeyVisible() ? "Hide license key" : "Show license key"}
                >
                  <Show
                    when={isKeyVisible()}
                    fallback={<FiEye class="w-4 h-4 text-muted-foreground" />}
                  >
                    <FiEyeOff class="w-4 h-4 text-muted-foreground" />
                  </Show>
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <Show when={!isFull()}>
        <div class="border rounded-lg p-5">
          <div class="mb-4">
            <h2 class="font-bold text-lg">Activate Full License</h2>
            <p class="text-sm text-muted-foreground">
              Enter your license key to unlock unlimited access
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex gap-2">
              <input
                type="text"
                value={licenseKey()}
                onInput={(e) => {
                  setLicenseKey(e.currentTarget.value);
                  setActivationError(null);
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={isActivating()}
                class={cn(
                  "flex-1 px-3 py-2 text-sm rounded-lg border bg-background",
                  "focus:outline-none focus:ring-2 focus:ring-ring",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "placeholder:text-muted-foreground",
                  activationError() && "border-destructive",
                )}
              />
              <Button onClick={handleActivate} disabled={isActivating() || !licenseKey().trim()}>
                {isActivating() ? "Activating..." : "Activate"}
              </Button>
            </div>

            <Show when={activationError()}>
              <p class="text-sm text-destructive">{activationError()}</p>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={!isFull()}>
        <div class="text-center text-xs text-muted-foreground">
          <p>Need more uses? Upgrade to Full for unlimited access.</p>
        </div>
      </Show>
    </div>
  );
}

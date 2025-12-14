import { FiEye, FiEyeOff } from "solid-icons/fi";
import { createSignal, onMount, Show } from "solid-js";

import { cn } from "@/shared/libs/cn";
import { SnappitLicense } from "@/shared/libs/license";
import {
  activateFullLicense,
  deactivateLicense,
  getLicenseKey,
  updateTrayLicenseStatus,
} from "@/shared/tauri/license_api";
import { Button } from "@/shared/ui/button";

export function License() {
  const [licenseState, refetch] = SnappitLicense.create();
  const [licenseKey, setLicenseKey] = createSignal("");
  const [storedLicenseKey, setStoredLicenseKey] = createSignal<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = createSignal(false);
  const [isActivating, setIsActivating] = createSignal(false);
  const [isDeactivating, setIsDeactivating] = createSignal(false);
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
  const usesRemaining = () => SnappitLicense.getUsesRemaining(licenseState());

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

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateLicense();
      await updateTrayLicenseStatus();
      setStoredLicenseKey(null);
      setIsKeyVisible(false);
      refetch();
    } catch (e) {
      console.error("Failed to deactivate license:", e);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <h2 class="text-center text-bold mb-3 font-bold text-xl">About your license</h2>

      <div class="p-3 bg-card rounded-lg mb-3">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-light">License type</span>
          <span
            class={cn(
              "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
              isFull() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {isFull() ? "Full" : "Trial"}
          </span>
        </div>

        <Show when={!isFull()}>
          <div class="flex justify-between items-center">
            <span class="text-sm font-light">Uses remaining</span>
            <span class="text-sm font-medium">{usesRemaining()}</span>
          </div>
        </Show>

        <Show when={isFull()}>
          <div class="flex items-center gap-2 text-primary">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm font-medium">Product activated</span>
          </div>
        </Show>
      </div>

      <Show when={!isFull()}>
        <div class="p-3 bg-card rounded-lg">
          <div class="text-sm font-light mb-2">Activate license</div>
          <div class="flex gap-2">
            <input
              type="text"
              value={licenseKey()}
              onInput={(e) => {
                setLicenseKey(e.currentTarget.value);
                setActivationError(null);
              }}
              placeholder="Enter license key"
              class="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button onClick={handleActivate} disabled={isActivating() || !licenseKey().trim()}>
              {isActivating() ? "Activating..." : "Activate"}
            </Button>
          </div>
          <Show when={activationError()}>
            <div class="text-destructive text-xs mt-2">{activationError()}</div>
          </Show>
        </div>
      </Show>

      <Show when={isFull() && storedLicenseKey()}>
        <div class="p-3 bg-card rounded-lg mb-3">
          <div class="text-sm font-light mb-2">License key</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md font-mono">
              {isKeyVisible() ? storedLicenseKey() : maskLicenseKey(storedLicenseKey()!)}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsKeyVisible(!isKeyVisible())}>
              <Show when={isKeyVisible()} fallback={<FiEye class="w-4 h-4" />}>
                <FiEyeOff class="w-4 h-4" />
              </Show>
            </Button>
          </div>
        </div>

        {/*<div class="p-3 bg-card rounded-lg">*/}
        <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating()}>
          {isDeactivating() ? "Deactivating..." : "Deactivate device"}
        </Button>
        {/*</div>*/}
      </Show>
    </>
  );
}

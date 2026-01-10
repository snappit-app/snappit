import { createSignal, Show } from "solid-js";

import { activateFullLicense, updateTrayLicenseStatus } from "@/shared/tauri/license_api";
import { Button } from "@/shared/ui/button";

interface TrialLicenseProps {
  usesRemaining: number;
  onActivated: () => void;
}

export function TrialLicense(props: TrialLicenseProps) {
  const [licenseKey, setLicenseKey] = createSignal("");
  const [isActivating, setIsActivating] = createSignal(false);
  const [activationError, setActivationError] = createSignal<string | null>(null);

  const isExpired = () => props.usesRemaining === 0;

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
      setLicenseKey("");
      props.onActivated();
    } catch (e) {
      console.error("Failed to activate license:", e);
      setActivationError("Failed to activate license. Please check your key and try again.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <>
      <div class="p-3 bg-card rounded-lg mb-3">
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

      <Show when={!isExpired()}>
        <div class="p-3 rounded-lg bg-card">
          <div class="flex items-center justify-between mb-1 text-sm font-light">
            <span>Trial version</span>
            <span>{props.usesRemaining} uses remain</span>
          </div>

          <p class="text-xs text-muted-foreground">
            Purchase a license for unlimited access to all features.
          </p>
        </div>
      </Show>

      <Show when={isExpired()}>
        <div class="p-3 rounded-lg bg-destructive">
          <p class="text-xs text-destructive-foreground">
            Your trial has expired <br />
            Please purchase a license to continue using the app
          </p>
        </div>
      </Show>
    </>
  );
}

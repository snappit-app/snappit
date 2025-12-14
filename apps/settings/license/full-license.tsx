import { BiSolidCheckCircle } from "solid-icons/bi";
import { FiEye, FiEyeOff } from "solid-icons/fi";
import { createSignal, Show } from "solid-js";

import { deactivateLicense, updateTrayLicenseStatus } from "@/shared/tauri/license_api";
import { Button } from "@/shared/ui/button";

interface FullLicenseProps {
  licenseKey: string;
  onDeactivated: () => void;
}

export function FullLicense(props: FullLicenseProps) {
  const [isKeyVisible, setIsKeyVisible] = createSignal(false);
  const [isDeactivating, setIsDeactivating] = createSignal(false);

  const maskLicenseKey = (key: string) => {
    if (key.length <= 4) return "*".repeat(key.length);
    return "*".repeat(key.length - 4) + key.slice(-4);
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateLicense();
      await updateTrayLicenseStatus();
      props.onDeactivated();
    } catch (e) {
      console.error("Failed to deactivate license:", e);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <>
      <div class="p-3 bg-card rounded-lg mb-3">
        <div class="text-sm font-light mb-2">License key</div>
        <div class="flex items-center gap-2">
          <div class="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md font-mono">
            {isKeyVisible() ? props.licenseKey : maskLicenseKey(props.licenseKey)}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsKeyVisible(!isKeyVisible())}>
            <Show when={isKeyVisible()} fallback={<FiEye class="w-4 h-4" />}>
              <FiEyeOff class="w-4 h-4" />
            </Show>
          </Button>
        </div>
      </div>

      <div class="p-3 bg-card rounded-lg flex justify-between">
        <div class="flex items-center gap-1">
          <BiSolidCheckCircle />
          <span class="text-sm font-medium">Product activated</span>
        </div>
        <Button variant="destructive" onClick={handleDeactivate} disabled={isDeactivating()}>
          {isDeactivating() ? "Deactivating..." : "Deactivate device"}
        </Button>
      </div>
    </>
  );
}

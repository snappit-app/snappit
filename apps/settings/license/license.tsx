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
    <>
      <h2 class="text-center text-bold mb-3 font-bold text-xl">About your license</h2>
      <div class="p-3 bg-card rounded-lg mb-3" />
    </>
  );
}

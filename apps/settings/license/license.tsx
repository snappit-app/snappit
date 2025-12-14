import { listen } from "@tauri-apps/api/event";
import { createSignal, onCleanup, onMount, Show } from "solid-js";

import { SnappitLicense } from "@/shared/libs/license";
import { getLicenseKey } from "@/shared/tauri/license_api";

import { FullLicense } from "./full-license";
import { TrialLicense } from "./trial-license";

export function License() {
  const [licenseState, refetch] = SnappitLicense.create();
  const [storedLicenseKey, setStoredLicenseKey] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const key = await getLicenseKey();
      setStoredLicenseKey(key);
    } catch (e) {
      console.error("Failed to get license key:", e);
    }

    const unlisten = await listen<number>("license:uses_consumed", () => {
      refetch();
    });

    onCleanup(() => {
      unlisten();
    });
  });

  const isFull = () => SnappitLicense.isFull(licenseState());
  const usesRemaining = () => SnappitLicense.getUsesRemaining(licenseState());

  const handleActivated = async () => {
    const key = await getLicenseKey();
    setStoredLicenseKey(key);
    refetch();
  };

  const handleDeactivated = () => {
    setStoredLicenseKey(null);
    refetch();
  };

  return (
    <>
      <h2 class="text-center text-bold mb-3 font-bold text-xl">About your license</h2>

      <Show
        when={isFull() && storedLicenseKey()}
        fallback={<TrialLicense usesRemaining={usesRemaining()} onActivated={handleActivated} />}
      >
        <FullLicense licenseKey={storedLicenseKey()!} onDeactivated={handleDeactivated} />
      </Show>
    </>
  );
}

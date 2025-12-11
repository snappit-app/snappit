import { createResource, createRoot, Resource } from "solid-js";

import { getLicenseState, LicenseState } from "@/shared/tauri/license_api";

export abstract class SnappitLicense {
  private static _licenseSingleton: {
    dispose: () => void;
    state: Resource<LicenseState | null>;
    refetch: () => void;
  } | null = null;

  static create() {
    if (!this._licenseSingleton) {
      const inst = createRoot((dispose) => {
        const [state, { refetch }] = createResource<LicenseState | null>(async () => {
          try {
            return await getLicenseState();
          } catch (e) {
            console.error("Failed to get license state:", e);
            return null;
          }
        });

        return { state, refetch: () => refetch(), dispose } as const;
      });

      this._licenseSingleton = {
        dispose: inst.dispose,
        state: inst.state,
        refetch: inst.refetch,
      };
    }

    return [this._licenseSingleton!.state, this._licenseSingleton!.refetch] as const;
  }

  static isTrialExpired(state: LicenseState | null | undefined): boolean {
    if (!state) return false;
    return state.licenseType === "trial" && state.usesRemaining === 0;
  }

  static isFull(state: LicenseState | null | undefined): boolean {
    if (!state) return false;
    return state.licenseType === "full";
  }

  static getUsesRemaining(state: LicenseState | null | undefined): number {
    if (!state) return 0;
    return state.usesRemaining;
  }
}

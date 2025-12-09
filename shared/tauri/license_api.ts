import { invoke } from "@tauri-apps/api/core";

export interface LicenseState {
  licenseType: "trial" | "pro";
  usesRemaining: number;
  isValid: boolean;
}

export async function getLicenseState(): Promise<LicenseState> {
  return await invoke<LicenseState>("get_license_state");
}

export async function consumeToolUse(): Promise<number> {
  return await invoke<number>("consume_tool_use");
}

export async function activateProLicense(): Promise<void> {
  return await invoke<void>("activate_pro_license");
}

export async function updateTrayLicenseStatus(): Promise<void> {
  return await invoke<void>("update_tray_license_status");
}

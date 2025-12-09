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

export async function activateProLicense(licenseKey: string): Promise<void> {
  // TODO: In the future, this will validate the license key with the backend
  // For now, simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return await invoke<void>("activate_pro_license", { licenseKey });
}

export async function updateTrayLicenseStatus(): Promise<void> {
  return await invoke<void>("update_tray_license_status");
}

export async function getLicenseKey(): Promise<string | null> {
  return await invoke<string | null>("get_license_key");
}

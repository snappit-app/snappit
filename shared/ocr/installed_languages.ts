import { invoke } from "@tauri-apps/api/core";
import { createSignal } from "solid-js";

export interface SystemLanguageInfo {
  code: string;
  name: string;
}

export const [installedLanguages, setInstalledLanguages] = createSignal<string[]>([]);
export const [systemLanguages, setSystemLanguages] = createSignal<string[]>([]);
export const [systemLanguagesInfo, setSystemLanguagesInfo] = createSignal<SystemLanguageInfo[]>([]);
export const [isInitialSetup, setIsInitialSetup] = createSignal(false);
export const [isMacOS, setIsMacOS] = createSignal(false);

export async function refreshInstalledLanguages() {
  try {
    const langs = await invoke<string[]>("get_tess_languages");
    setInstalledLanguages(langs);
  } catch (e) {
    console.error("Failed to get installed languages", e);
  }
}

export async function refreshSystemLanguages() {
  try {
    const langs = await invoke<string[]>("get_system_tess_languages");
    setSystemLanguages(langs);
  } catch (e) {
    console.error("Failed to get system languages", e);
  }
}

export async function refreshSystemLanguagesInfo() {
  try {
    const info = await invoke<SystemLanguageInfo[]>("get_system_languages_info");
    setSystemLanguagesInfo(info);
  } catch (e) {
    console.error("Failed to get system languages info", e);
  }
}

export async function checkIsMacOS() {
  try {
    const result = await invoke<boolean>("is_macos");
    setIsMacOS(result);
  } catch (e) {
    console.error("Failed to check if macOS", e);
  }
}

export async function ensureSystemLanguagesInstalled() {
  await checkIsMacOS();
  await refreshSystemLanguages();
  await refreshSystemLanguagesInfo();
  await refreshInstalledLanguages();

  // On macOS, we don't need to install system languages for Tesseract
  // because Vision is used for auto mode
  if (isMacOS()) {
    return;
  }

  const system = systemLanguages();
  const installed = installedLanguages();

  const missing = system.filter((lang) => !installed.includes(lang));

  if (missing.length > 0) {
    setIsInitialSetup(true);
    try {
      for (const lang of missing) {
        await invoke("download_tess_language", { lang });
      }
      await refreshInstalledLanguages();
    } finally {
      setIsInitialSetup(false);
    }
  }
}

export function isSystemLanguage(lang: string) {
  // On macOS, system languages are only "system" in terms of Vision usage
  // They are not protected from deletion in Tesseract
  return systemLanguages().includes(lang);
}

export function canDeleteLanguage(lang: string) {
  // On macOS, any language can be deleted (including system languages)
  // On other platforms, system languages cannot be deleted
  if (isMacOS()) {
    return true;
  }
  return !isSystemLanguage(lang);
}

export async function downloadLanguage(lang: string) {
  await invoke("download_tess_language", { lang });
  await refreshInstalledLanguages();
}

export async function deleteLanguage(lang: string) {
  await invoke("delete_tess_language", { lang });
  await refreshInstalledLanguages();
}

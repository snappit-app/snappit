import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export const [installedLanguages, setInstalledLanguages] = createSignal<string[]>([]);
export const [systemLanguages, setSystemLanguages] = createSignal<string[]>([]);
export const [isInitialSetup, setIsInitialSetup] = createSignal(false);

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

export async function ensureSystemLanguagesInstalled() {
    await refreshSystemLanguages();
    await refreshInstalledLanguages();
    
    const system = systemLanguages();
    const installed = installedLanguages();
    
    const missing = system.filter(lang => !installed.includes(lang));
    
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
    return systemLanguages().includes(lang);
}

export async function downloadLanguage(lang: string) {
    await invoke("download_tess_language", { lang });
    await refreshInstalledLanguages();
}

export async function deleteLanguage(lang: string) {
    await invoke("delete_tess_language", { lang });
    await refreshInstalledLanguages();
}

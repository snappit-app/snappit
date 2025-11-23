import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/core";

export const [installedLanguages, setInstalledLanguages] = createSignal<string[]>([]);

export async function refreshInstalledLanguages() {
  try {
    const langs = await invoke<string[]>("get_tess_languages");
    setInstalledLanguages(langs);
  } catch (e) {
    console.error("Failed to get installed languages", e);
  }
}

export async function downloadLanguage(lang: string) {
    await invoke("download_tess_language", { lang });
    await refreshInstalledLanguages();
}

export async function deleteLanguage(lang: string) {
    await invoke("delete_tess_language", { lang });
    await refreshInstalledLanguages();
}

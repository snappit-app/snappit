import { getVersion } from "@tauri-apps/api/app";
import { createSignal, onMount } from "solid-js";

export function createVersion() {
  const [version, setVersion] = createSignal<string>("");

  onMount(async () => {
    const v = await getVersion();
    setVersion(v);
  });

  return version;
}

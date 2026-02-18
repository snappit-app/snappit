import { platform } from "@tauri-apps/plugin-os";

import { MacOSLanguages } from "./languages_macos";
import { MultiplatformLanguages } from "./languages_multiplatform";

const IS_MACOS = platform() === "macos";

export function Languages() {
  return (
    <>
      <h2 class="shrink-0 text-center text-bold font-bold text-xl mb-3">Languages</h2>

      {IS_MACOS ? <MacOSLanguages /> : <MultiplatformLanguages />}
    </>
  );
}

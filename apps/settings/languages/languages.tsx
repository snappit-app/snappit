import { platform } from "@tauri-apps/plugin-os";

import { MacOSLanguages } from "./languages_macos";
import { MultiplatformLanguages } from "./languages_multiplatform";

const IS_MACOS = platform() === "macos";

export function Languages() {
  return <>{IS_MACOS ? <MacOSLanguages /> : <MultiplatformLanguages />}</>;
}

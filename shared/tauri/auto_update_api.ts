import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export abstract class AutoUpdateApi {
  static async setUpdateReady(ready: boolean): Promise<void> {
    return invoke("set_update_ready", { ready });
  }

  static async isUpdateReady(): Promise<boolean> {
    return invoke("is_update_ready");
  }

  static async onUpdateReadyChanged(handler: (ready: boolean) => void): Promise<UnlistenFn> {
    return listen<boolean>("update:ready_changed", (event) => handler(event.payload));
  }
}

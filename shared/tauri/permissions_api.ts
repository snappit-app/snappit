import { invoke } from "@tauri-apps/api/core";
import { Event, listen } from "@tauri-apps/api/event";

export type PermissionsState = {
  screenRecording: boolean;
};

const PERMISSIONS_EVENT = "permissions:state";

export abstract class PermissionsApi {
  static async getState() {
    return invoke<PermissionsState>("get_permissions_state");
  }

  static async requestScreenRecordingPermission() {
    return invoke<PermissionsState>("request_screen_recording_permission");
  }

  static async openScreenRecordingPreferences() {
    return invoke("open_screen_recording_settings");
  }

  static async onChanged(handler: (state: PermissionsState) => void) {
    const unlisten = await listen<PermissionsState>(
      PERMISSIONS_EVENT,
      (event: Event<PermissionsState>) => handler(event.payload),
    );

    return () => unlisten();
  }
}

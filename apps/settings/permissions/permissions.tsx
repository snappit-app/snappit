import { Button } from "@shared/ui/button";
import { BiSolidHelpCircle } from "solid-icons/bi";

import { createPermissions } from "@/shared/libs/permissions";
import { PermissionsApi } from "@/shared/tauri/permissions_api";
import { tooltip } from "@/shared/ui/tooltip";

void tooltip;

const tooltipText = () => (
  <>
    <div class="whitespace-nowrap">Snappit requires Screen Recording access on macOS.</div>
    <div>Follow the steps below to allow it.</div>
  </>
);

export function PermissionsGate() {
  const permissions = createPermissions();

  async function handleRequest() {
    try {
      const next = await PermissionsApi.requestScreenRecordingPermission();
      permissions.setState(next);
    } catch (error) {
      console.error("Failed to request screen recording permission", error);
    }
  }

  async function handleOpenSettings() {
    try {
      await PermissionsApi.openScreenRecordingPreferences();
    } catch (error) {
      console.error("Failed to open screen recording preferences", error);
    }
  }

  return (
    <>
      <div class="text-center text-bold mb-3 font-bold text-xl flex items-center gap-2 justify-center">
        <h2>Screen access required</h2>
        <div use:tooltip={{ content: tooltipText() }}>
          <BiSolidHelpCircle class="text-xs" />
        </div>
      </div>

      <div class="rounded-lg p-3 bg-card mb-3">
        <h4 class="mb-3">How to enable Screen Recording</h4>
        <ol class="list-decimal space-y-2 pl-5 text-sm mb-2">
          <li>Open macOS Screen Recording preferences.</li>
          <li>
            Enable <strong>Snappit</strong> and confirm.
          </li>
          <li>Restart the app.</li>
        </ol>

        <div class="flex gap-2">
          <Button variant="outline" onClick={handleRequest} size={"sm"}>
            Ask macOS for access
          </Button>
          <Button variant="outline" onClick={handleOpenSettings} size={"sm"}>
            Open settings
          </Button>
        </div>
      </div>
    </>
  );
}

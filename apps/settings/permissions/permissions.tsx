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
    <div class="h-full flex flex-col p-6">
      <div class="space-y-2 flex items-center gap-4 mb-4">
        <h2 class="text-2xl font-bold mb-0">Screen access required</h2>
        <div use:tooltip={{ content: tooltipText() }}>
          <BiSolidHelpCircle />
        </div>
      </div>

      <div class="rounded-lg border p-6 space-y-4">
        <div class="space-y-2">
          <h2 class="text-lg font-semibold">How to enable Screen Recording</h2>
          <ol class="list-decimal space-y-2 pl-5 text-sm">
            <li>Open macOS Screen Recording preferences.</li>
            <li>
              Enable <strong>Snappit</strong> and confirm.
            </li>
            <li>Restart the app.</li>
          </ol>
        </div>

        <div class="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleRequest} size={"sm"}>
            Ask macOS for access
          </Button>
          <Button variant="outline" onClick={handleOpenSettings} size={"sm"}>
            Open settings
          </Button>
        </div>
      </div>
    </div>
  );
}

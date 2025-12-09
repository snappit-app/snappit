import { SnappitLicense } from "@/shared/libs/license";
import { LicenseStatus } from "@/shared/ui/license_status";

export function License() {
  const [licenseState, refetch] = SnappitLicense.create();

  // Refetch on mount
  refetch();

  return (
    <div class="p-6 flex flex-col gap-4">
      <LicenseStatus />

      <div class="border rounded-lg p-5">
        <div class="mb-4">
          <h2 class="font-bold text-lg">About Your License</h2>
          <p class="text-sm text-muted-foreground">Manage your Snappit subscription</p>
        </div>

        <div class="flex flex-col gap-3 text-sm">
          <div class="flex justify-between items-center">
            <span class="text-muted-foreground">License Type</span>
            <span class="font-medium capitalize">{licenseState()?.licenseType ?? "—"}</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-muted-foreground">Uses Remaining</span>
            <span class="font-medium">
              {licenseState()?.licenseType === "pro"
                ? "Unlimited"
                : (licenseState()?.usesRemaining ?? "—")}
            </span>
          </div>
        </div>
      </div>

      <div class="text-center text-xs text-muted-foreground">
        <p>Need more uses? Upgrade to Pro for unlimited access.</p>
      </div>
    </div>
  );
}

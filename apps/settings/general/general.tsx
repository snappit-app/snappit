import { Button } from "@shared/ui/button";
import { KeyboardButton } from "@shared/ui/keyboard_button";

export function General() {
  return (
    <div class="h-full flex flex-col">
      <div class="p-9 border-b-1">
        <h1 class="font-bold text-3xl">Welcome to TextSnap</h1>
        <p class="">your personal screen assistant</p>
      </div>

      <div class="p-9">
        <h2 class="font-bold mb-1 text-lg">Snap shortcut</h2>

        <div class="flex justify-between items-center">
          <div class="flex items-center gap-1">
            <KeyboardButton key={"cmd"} />
            <KeyboardButton key={"shift"} />
            <KeyboardButton key={"2"} />
          </div>
          <div class="flex flex-col gap-2">
            <Button size="sm" variant="muted">
              Record
            </Button>
            <Button size="sm" variant="muted">
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import "./app.css";

import { onCleanup, onMount } from "solid-js";

import { Button } from "@/components/ui/button";
import { registerShowSnapShortcut, unregisterShowSnapShortcut } from "@/tauri/show_snap_overlay";

function App() {
  onMount(() => {
    registerShowSnapShortcut();

    onCleanup(() => {
      unregisterShowSnapShortcut();
    });
  });

  return (
    <main class="container h-full flex justify-center items-center">
      <Button>Snap</Button>
    </main>
  );
}

export default App;

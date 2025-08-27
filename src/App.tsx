import "./app.css";

import { Button } from "@/components/ui/button";
import { showSnapOverlay } from "@/tauri/show_snap_ovberlay";

function App() {
  async function showOverlay() {
    showSnapOverlay();
  }

  return (
    <main class="container h-full flex justify-center items-center">
      <Button onClick={() => showOverlay()}>Snap</Button>
    </main>
  );
}

export default App;

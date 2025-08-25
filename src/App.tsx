import "./App.css";

import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { Button } from "@/components/ui/button";

function App() {
  async function showOverlay() {
    const overlay = await WebviewWindow.getByLabel("snap_overlay");
    console.log(overlay);
    if (overlay) {
      await overlay.show();
      await overlay.setFocus();
    }
  }

  return (
    <main class="container h-full flex justify-center items-center">
      <Button onClick={() => showOverlay()}>Snap</Button>
    </main>
  );
}

export default App;

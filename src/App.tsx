import "./App.css";

import { invoke } from "@tauri-apps/api/core";

import { Button } from "@/components/ui/button";

function App() {
  const openOverlay = async () => {
    await invoke("show_snap_overlay");
  };
  return (
    <main class="container h-full flex justify-center items-center">
      <Button onClick={() => openOverlay()}>click</Button>
    </main>
  );
}

export default App;

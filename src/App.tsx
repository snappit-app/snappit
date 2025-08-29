import "./app.css";

import { onCleanup, onMount } from "solid-js";
import { createWorker } from "tesseract.js";

import { Button } from "@/components/ui/button";
import { registerShowSnapShortcut, unregisterShowSnapShortcut } from "@/tauri/show_snap_overlay";

function App() {
  onMount(() => {
    registerShowSnapShortcut();

    onCleanup(() => {
      unregisterShowSnapShortcut();
    });
  });

  const asd = () => {
    (async () => {
      const worker = await createWorker("eng");
      const ret = await worker.recognize("https://tesseract.projectnaptha.com/img/eng_bw.png");
      console.log(ret.data.text);
      await worker.terminate();
    })();
  };

  return (
    <main class="container h-full flex justify-center items-center">
      <Button onClick={() => asd()}>Snap</Button>
    </main>
  );
}

export default App;

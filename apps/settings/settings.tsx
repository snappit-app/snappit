import { General } from "@settings/general";
import { Button } from "@shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";

function Settings() {
  return (
    <main class="h-full">
      <Tabs defaultValue="account" class="h-full flex flex-col">
        <header class="p-3 border-b-1">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ocr">OCR Settings</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
        </header>

        <div class="grow-1">
          <TabsContent class="h-full" value="general">
            <General />
          </TabsContent>
          <TabsContent value="ocr">password</TabsContent>
          <TabsContent value="about">Change your password here.</TabsContent>
        </div>

        <footer class="p-3 flex gap-3 justify-end border-t-1">
          <Button size="sm" variant={"outline"}>
            Cancel
          </Button>
          <Button size="sm" variant={"secondary"}>
            Save
          </Button>
        </footer>
      </Tabs>
    </main>
  );
}

export default Settings;

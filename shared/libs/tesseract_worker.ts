import { createResource } from "solid-js";
import { createWorker, Worker } from "tesseract.js";

let createdWorker: null | Worker = null;

export const TESSERACT_WORKER: Promise<Worker> = createOrGetWorker();

async function createOrGetWorker(eng: string[] = ["eng", "rus"]): Promise<Worker> {
  if (!createdWorker) {
    createdWorker = await createWorker(eng);
  }

  return createdWorker;
}

export function createTesseractWorker(eng: string[] = ["eng", "rus"]) {
  const [worker] = createResource(async () => {
    if (!createdWorker) {
      createdWorker = await createWorker(eng);
    }

    return createdWorker;
  });

  return [worker];
}

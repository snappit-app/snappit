import { createWorker, Worker } from "tesseract.js";

const createdWorker: null | Worker = null;

export const TESSERACT_WORKER: Promise<Worker> = createOrGetWorker();

async function createOrGetWorker(): Promise<Worker> {
  if (createdWorker) {
    return createdWorker;
  }

  return createWorker(["eng", "rus"]);
}

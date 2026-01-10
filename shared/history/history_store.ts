import { emit } from "@tauri-apps/api/event";

import { SNAPPIT_CONSTS } from "@/shared/constants";
import { SnappitStore } from "@/shared/store";

import { CaptureHistoryItem, DropperPayload, OcrPayload, QrPayload, RulerPayload } from "./types";

const MAX_HISTORY_SIZE = 200;
export const HISTORY_UPDATED_EVENT = "history:updated";

export class CaptureHistory {
  private static KEY = SNAPPIT_CONSTS.store.keys.capture_history;

  static create() {
    return SnappitStore.createValue<CaptureHistoryItem[]>(this.KEY);
  }

  static async addOcr(payload: OcrPayload) {
    await this.addItem({ type: "ocr", payload });
  }

  static async addQr(payload: QrPayload) {
    await this.addItem({ type: "qr", payload });
  }

  static async addDropper(payload: DropperPayload) {
    await this.addItem({ type: "dropper", payload });
  }

  static async addRuler(payload: RulerPayload) {
    await this.addItem({ type: "ruler", payload });
  }

  private static async addItem(item: Omit<CaptureHistoryItem, "id" | "timestamp">) {
    const [history, setHistory] = this.create();
    const current = history() ?? [];

    const newItem: CaptureHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    } as CaptureHistoryItem;

    const updated = [newItem, ...current].slice(0, MAX_HISTORY_SIZE);
    await setHistory(updated);
    await emit(HISTORY_UPDATED_EVENT);
  }

  static async remove(id: string) {
    const [history, setHistory] = this.create();
    const current = history() ?? [];
    const updated = current.filter((item) => item.id !== id);
    await setHistory(updated);
    await emit(HISTORY_UPDATED_EVENT);
  }

  static async clear() {
    const [, setHistory] = this.create();
    await setHistory([]);
    await emit(HISTORY_UPDATED_EVENT);
  }
}

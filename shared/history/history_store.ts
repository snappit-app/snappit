import { emit } from "@tauri-apps/api/event";
import { load } from "@tauri-apps/plugin-store";

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

  private static async getFromStore(): Promise<CaptureHistoryItem[]> {
    const store = await load(SNAPPIT_CONSTS.store.file);
    return (await store.get<CaptureHistoryItem[]>(this.KEY)) ?? [];
  }

  private static async saveToStore(items: CaptureHistoryItem[]) {
    const store = await load(SNAPPIT_CONSTS.store.file);
    await store.set(this.KEY, items);
    await store.save();
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
    const current = await this.getFromStore();

    const newItem: CaptureHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    } as CaptureHistoryItem;

    const updated = [newItem, ...current].slice(0, MAX_HISTORY_SIZE);
    await this.saveToStore(updated);
    await emit(HISTORY_UPDATED_EVENT);
  }

  static async remove(id: string) {
    const current = await this.getFromStore();
    const updated = current.filter((item) => item.id !== id);
    await this.saveToStore(updated);
    await emit(HISTORY_UPDATED_EVENT);
  }

  static async clear() {
    await this.saveToStore([]);
    await emit(HISTORY_UPDATED_EVENT);
  }
}

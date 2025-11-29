import { ColorInfo } from "@/shared/tauri/screen_capture_api";

export interface SnappitQrResponse {
  kind: "qr";
  payload: string;
}

export type SnappitOcrEngine = "vision" | "tesseract";

export interface SnappitOcrPayload {
  value: string;
  ocr: SnappitOcrEngine;
}

export interface SnappitOcrResponse {
  kind: "ocr";
  payload: SnappitOcrPayload;
}

export interface SnappitDropperResponse {
  kind: "dropper";
  payload: ColorInfo;
}

export type SnappitResponse = SnappitQrResponse | SnappitOcrResponse | SnappitDropperResponse;

import { ColorInfo } from "@/shared/tauri/screen_capture_api";

export interface SnappitQrResponse {
  kind: "qr";
  payload: string;
}

export interface SnappitOcrResponse {
  kind: "ocr";
  payload: string;
}

export interface SnappitDropperResponse {
  kind: "dropper";
  payload: ColorInfo;
}

export type SnappitResponse = SnappitQrResponse | SnappitOcrResponse | SnappitDropperResponse;

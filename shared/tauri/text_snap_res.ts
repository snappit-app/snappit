import { ColorInfo } from "@/shared/tauri/screen_capture_api";

export interface TextSnapQrResponse {
  kind: "qr";
  payload: string;
}

export interface TextSnapOcrResponse {
  kind: "ocr";
  payload: string;
}

export interface TextSnapDropperResponse {
  kind: "dropper";
  payload: ColorInfo;
}

export type TextSnapResponse = TextSnapQrResponse | TextSnapOcrResponse | TextSnapDropperResponse;

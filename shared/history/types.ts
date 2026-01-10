// Base interface for all history items
interface BaseCaptureHistoryItem {
  id: string;
  timestamp: number;
}

// OCR payload
export interface OcrPayload {
  text: string;
  engine: "vision" | "tesseract";
}

// Ruler payload
export interface RulerPayload {
  value: string;
}

// QR payload
export interface QrPayload {
  content: string;
}

// Dropper payload
export interface DropperPayload {
  hex: string;
  rgb: [number, number, number];
  formattedColor: string;
}

// Typed history items
export interface OcrCaptureItem extends BaseCaptureHistoryItem {
  type: "ocr";
  payload: OcrPayload;
}

export interface RulerCaptureItem extends BaseCaptureHistoryItem {
  type: "ruler";
  payload: RulerPayload;
}

export interface QrCaptureItem extends BaseCaptureHistoryItem {
  type: "qr";
  payload: QrPayload;
}

export interface DropperCaptureItem extends BaseCaptureHistoryItem {
  type: "dropper";
  payload: DropperPayload;
}

// Union type for all history items
export type CaptureHistoryItem =
  | OcrCaptureItem
  | RulerCaptureItem
  | QrCaptureItem
  | DropperCaptureItem;

// Utility type to get payload by type
export type PayloadByType<T extends CaptureHistoryItem["type"]> = Extract<
  CaptureHistoryItem,
  { type: T }
>["payload"];

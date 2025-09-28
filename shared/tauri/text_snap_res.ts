export interface TextSnapResponse {
  kind: "ocr" | "qr";
  payload: string;
}

export interface TextSnapQrResponse extends TextSnapResponse {
  kind: "qr";
  payload: string;
}

export interface TextSnapOcrResponse extends TextSnapResponse {
  kind: "ocr";
  payload: string;
}

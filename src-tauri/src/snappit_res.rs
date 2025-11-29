use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SnappitOcrEngine {
    Vision,
    Tesseract,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnappitOcrResult {
    pub value: String,
    pub ocr: SnappitOcrEngine,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
pub enum SnappitResponse {
    Qr(Option<String>),
    Ocr(SnappitOcrResult),
}

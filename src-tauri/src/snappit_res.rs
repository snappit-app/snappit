use serde::{Deserialize, Serialize};

use crate::snappit_screen_capture::SnappitColorInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
pub enum SnappitResponse {
    Qr(Option<String>),
    Ocr(String),
    Dropper(SnappitColorInfo),
}

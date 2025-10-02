use serde::{Deserialize, Serialize};

use crate::text_snap_screen_capture::TextSnapColorInfo;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "payload", rename_all = "snake_case")]
pub enum TextSnapResponse {
    Qr(Option<String>),
    Ocr(String),
    Dropper(TextSnapColorInfo),
}

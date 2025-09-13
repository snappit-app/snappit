mod paddle_ocr;

use image::{ImageBuffer, Rgba};
use tauri::{AppHandle, Emitter};

use crate::{
    text_snap_errors::TextSnapResult, text_snap_ocr::paddle_ocr::TextSnapPaddleOCR,
    traits::IntoDynamic,
};

pub struct TextSnapOcr;

impl TextSnapOcr {
    pub fn recognize(app: &AppHandle, image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> TextSnapResult<()> {
        let dyn_img = (image.width(), image.height(), image.into_raw()).into_dynamic()?;

        let text = TextSnapPaddleOCR::recognize(&dyn_img)?;

        let _ = app.emit("ocr:recognized", serde_json::json!(text));

        Ok(())
    }
}

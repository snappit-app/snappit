use image::{ImageBuffer, Rgba};

use crate::{
    text_snap_errors::TextSnapResult, text_snap_ocr::tesseract_ocr::TextSnapTesseractOcr,
    traits::IntoDynamic,
};

pub struct TextSnapOcr;

impl TextSnapOcr {
    pub fn recognize(
        app: &tauri::AppHandle,
        image: ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> TextSnapResult<String> {
        let dyn_img = (image.width(), image.height(), image.into_raw()).into_dynamic()?;

        let text = TextSnapTesseractOcr::recognize(app, &dyn_img)?;

        Ok(text)
    }
}

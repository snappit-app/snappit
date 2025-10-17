use image::{ImageBuffer, Rgba};

use crate::{
    snappit_errors::SnappitResult, snappit_ocr::tesseract_ocr::SnappitTesseractOcr,
    traits::IntoDynamic,
};

pub struct SnappitOcr;

impl SnappitOcr {
    pub fn recognize(
        app: &tauri::AppHandle,
        image: ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> SnappitResult<String> {
        let dyn_img = (image.width(), image.height(), image.into_raw()).into_dynamic()?;

        let text = SnappitTesseractOcr::recognize(app, &dyn_img)?;

        Ok(text)
    }
}

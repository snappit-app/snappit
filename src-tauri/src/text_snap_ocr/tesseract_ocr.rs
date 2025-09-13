use image::DynamicImage;

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(img: &DynamicImage) -> TextSnapResult<String> {
        Ok(String::from("text"))
    }
}

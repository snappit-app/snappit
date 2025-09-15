use image::{DynamicImage, EncodableLayout};
use leptess::LepTess;
use std::path::PathBuf;

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(img: &DynamicImage) -> TextSnapResult<String> {
        let rgb = img.to_rgba8();
        let bytes = rgb.as_raw().as_bytes();

        let tessdata_dir: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("src")
            .join("text_snap_ocr")
            .join("tesseract_models");

        let mut lt = LepTess::new(Some(tessdata_dir.to_string_lossy().as_ref()), "eng")?;
        lt.set_image_from_mem(bytes)?;
        println!("{}", lt.get_utf8_text().unwrap());

        Ok(String::from("text"))
    }
}

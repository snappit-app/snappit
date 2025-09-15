use std::io::Cursor;

use colored::Colorize;
use image::{DynamicImage, ImageFormat};
use leptess::LepTess;
use tauri::Manager;

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(img: &DynamicImage) -> TextSnapResult<String> {
        let mut buf: Vec<u8> = Vec::new();
        let _ = img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png);

        let mut lt = LepTess::new(None, "eng")?;
        lt.set_image_from_mem(&buf)?;
        lt.set_source_resolution(300);

        let text = lt.get_utf8_text()?;

        log::info!("{} = {}", "TESSERACT_RESULT".green(), text);

        Ok(text)
    }

    pub fn set_tessdata_prefix(app: &tauri::AppHandle) -> TextSnapResult<()> {
        let res_dir = app.path().resource_dir()?;

        log::info!("{} = {}", "TESSDATA_PREFIX".green(), res_dir.display());

        std::env::set_var("TESSDATA_PREFIX", &res_dir);

        Ok(())
    }
}

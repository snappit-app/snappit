use std::{io::Cursor, path::PathBuf};

use colored::Colorize;
use image::{DynamicImage, ImageFormat};
use leptess::LepTess;
use tauri::Manager;

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(app: &tauri::AppHandle, img: &DynamicImage) -> TextSnapResult<String> {
        let mut buf: Vec<u8> = Vec::new();
        let _ = img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png);
        let data_path = Self::get_data_path(app)?;

        let mut lt = LepTess::new(data_path.to_str(), "eng+rus")?;
        lt.set_image_from_mem(&buf)?;
        lt.set_source_resolution(300);

        let text = lt.get_utf8_text()?;

        log::info!("{} = {}", "TESSERACT_RESULT".green(), text);

        Ok(text)
    }

    pub fn get_data_path(app: &tauri::AppHandle) -> TextSnapResult<PathBuf> {
        let tess_data_path = app
            .path()
            .resource_dir()?
            .join("resources")
            .join("tessdata");

        log::info!(
            "{} = {}",
            "tess_data_path".green(),
            tess_data_path.display()
        );

        Ok(tess_data_path)
    }
}

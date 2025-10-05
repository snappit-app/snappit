use std::{borrow::Cow, io::Cursor, path::PathBuf};

use colored::Colorize;
use image::{DynamicImage, ImageFormat};
use leptess::LepTess;
use tauri::Manager;

use crate::{
    text_snap_consts::TEXT_SNAP_CONSTS, text_snap_errors::TextSnapResult,
    text_snap_store::TextSnapStore,
};

const DEFAULT_RECOGNITION_LANGUAGE: &str = "eng+rus";
const VALID_RECOGNITION_LANGUAGE_CODES: &[&str] = &[
    "eng", "rus", "chi_sim", "hin", "spa", "fra", "ara", "ben",
];

fn sanitize_recognition_language(raw: &str) -> Option<String> {
    let requested: Vec<&str> = raw
        .split('+')
        .map(|code| code.trim())
        .filter(|code| !code.is_empty())
        .collect();

    if requested.is_empty() {
        return None;
    }

    // Preserve the order defined in VALID_RECOGNITION_LANGUAGE_CODES so Tesseract
    // receives consistent combinations regardless of input order.
    let mut unique = Vec::new();
    for &code in VALID_RECOGNITION_LANGUAGE_CODES {
        if requested.iter().any(|candidate| candidate.eq_ignore_ascii_case(code)) {
            unique.push(code);
        }
    }

    if unique.is_empty() {
        None
    } else {
        Some(unique.join("+"))
    }
}

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(app: &tauri::AppHandle, img: &DynamicImage) -> TextSnapResult<String> {
        let mut buf: Vec<u8> = Vec::new();
        let _ = img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png);
        let data_path = Self::get_data_path(app)?;
        let recognition_language = Self::get_recognition_language(app)?;

        log::info!(
            "{} = {}",
            "tess_recognition_language".green(),
            recognition_language.as_ref()
        );

        let mut lt = LepTess::new(data_path.to_str(), recognition_language.as_ref())?;
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

    fn get_recognition_language(app: &tauri::AppHandle) -> TextSnapResult<Cow<'static, str>> {
        let key = TEXT_SNAP_CONSTS.store.keys.recognition_lang.as_str();
        let value = TextSnapStore::get_value(app, key)?
            .and_then(|stored| stored.as_str().map(String::from));

        let lang = match value {
            Some(lang) => {
                let trimmed = lang.trim();
                if trimmed.eq_ignore_ascii_case("auto") || trimmed.is_empty() {
                    Cow::Borrowed(DEFAULT_RECOGNITION_LANGUAGE)
                } else {
                    sanitize_recognition_language(trimmed)
                        .map(Cow::Owned)
                        .unwrap_or_else(|| Cow::Borrowed(DEFAULT_RECOGNITION_LANGUAGE))
                }
            }
            None => Cow::Borrowed(DEFAULT_RECOGNITION_LANGUAGE),
        };

        Ok(lang)
    }
}

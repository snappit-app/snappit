use std::{io::Cursor, path::PathBuf};

use colored::Colorize;
use image::{DynamicImage, ImageFormat};
use leptess::LepTess;
use tauri::Manager;

use crate::{
    text_snap_consts::TEXT_SNAP_CONSTS, text_snap_errors::TextSnapResult,
    text_snap_store::TextSnapStore,
};

const FALLBACK_RECOGNITION_LANGUAGE: &str = "eng";
const VALID_RECOGNITION_LANGUAGE_CODES: &[&str] = &[
    "eng", "rus", "chi_sim", "chi_tra", "jpn", "kor", "spa", "fra", "deu", "tha",
];

fn default_recognition_language() -> String {
    let mut prioritized: Vec<&'static str> = Vec::new();

    for locale in sys_locale::get_locales() {
        if let Some(code) = map_locale_to_tesseract_code(&locale) {
            if !prioritized.iter().any(|existing| existing == &code) {
                prioritized.push(code);
            }
        }
    }

    if prioritized.is_empty() {
        return FALLBACK_RECOGNITION_LANGUAGE.to_string();
    }

    let combined = prioritized.join("+");
    sanitize_recognition_language(&combined)
        .unwrap_or_else(|| FALLBACK_RECOGNITION_LANGUAGE.to_string())
}

fn map_locale_to_tesseract_code(locale: &str) -> Option<&'static str> {
    let normalized = locale.trim();
    if normalized.is_empty() {
        return None;
    }

    let normalized = normalized.replace('_', "-");
    let segments: Vec<String> = normalized
        .split('-')
        .map(|segment| segment.trim().to_ascii_lowercase())
        .filter(|segment| !segment.is_empty())
        .collect();

    let Some(language) = segments.get(0) else {
        return None;
    };

    match language.as_str() {
        "en" => Some("eng"),
        "ru" => Some("rus"),
        "zh" => {
            let is_traditional = segments
                .iter()
                .skip(1)
                .any(|segment| matches!(segment.as_str(), "hant" | "tw" | "hk" | "mo"));

            if is_traditional {
                Some("chi_tra")
            } else {
                Some("chi_sim")
            }
        }
        "ja" => Some("jpn"),
        "ko" => Some("kor"),
        "es" => Some("spa"),
        "fr" => Some("fra"),
        "de" => Some("deu"),
        "th" => Some("tha"),
        _ => None,
    }
}

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
        if requested
            .iter()
            .any(|candidate| candidate.eq_ignore_ascii_case(code))
        {
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
            recognition_language
        );

        log::info!("{} = {}", "tess_data_path".green(), recognition_language);
        let mut lt = LepTess::new(data_path.to_str(), recognition_language.as_str())?;
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

    fn get_recognition_language(app: &tauri::AppHandle) -> TextSnapResult<String> {
        let key = TEXT_SNAP_CONSTS.store.keys.recognition_lang.as_str();
        let value = TextSnapStore::get_value(app, key)?
            .and_then(|stored| stored.as_str().map(String::from));

        let default_language = default_recognition_language();
        let lang = match value {
            Some(lang) => {
                let trimmed = lang.trim();
                if trimmed.eq_ignore_ascii_case("auto") || trimmed.is_empty() {
                    default_language
                } else {
                    sanitize_recognition_language(trimmed).unwrap_or(default_language)
                }
            }
            None => default_language,
        };

        Ok(lang)
    }
}

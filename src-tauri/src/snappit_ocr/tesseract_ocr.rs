use std::{io::Cursor, path::PathBuf};

use image::{DynamicImage, ImageFormat};
use leptess::LepTess;
use tauri::Manager;

use crate::snappit_errors::SnappitResult;
use crate::snappit_ocr::recognition_language::default_recognition_language;
#[cfg(not(target_os = "macos"))]
use crate::snappit_ocr::recognition_language::get_system_recognition_languages;

pub struct SnappitTesseractOcr;

impl SnappitTesseractOcr {
    pub fn recognize(
        app: &tauri::AppHandle,
        img: &DynamicImage,
        recognition_language: &str,
    ) -> SnappitResult<String> {
        let mut buf: Vec<u8> = Vec::new();
        let _ = img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png);
        let data_path = Self::get_data_path(app)?;
        let recognition_language = if recognition_language.trim().is_empty() {
            default_recognition_language()
        } else {
            recognition_language.to_string()
        };

        let mut lt = LepTess::new(data_path.to_str(), recognition_language.as_str())?;
        lt.set_image_from_mem(&buf)?;
        lt.set_source_resolution(300);

        let text = lt.get_utf8_text()?;

        Ok(text)
    }

    pub fn get_data_path(app: &tauri::AppHandle) -> SnappitResult<PathBuf> {
        let app_data_dir = app.path().app_data_dir()?;
        let tess_data_path = app_data_dir.join("tessdata");

        if !tess_data_path.exists() {
            std::fs::create_dir_all(&tess_data_path)?;
        }

        Ok(tess_data_path)
    }

    pub fn ensure_initialized(app: &tauri::AppHandle) -> SnappitResult<()> {
        let data_path = Self::get_data_path(app)?;

        // On macOS, we don't bundle any languages - Vision is used for auto mode
        // On other platforms, copy bundled English if not present
        #[cfg(not(target_os = "macos"))]
        {
            let eng_path = data_path.join("eng.traineddata");
            if !eng_path.exists() {
                let resource_path = app
                    .path()
                    .resource_dir()?
                    .join("resources")
                    .join("tessdata")
                    .join("eng.traineddata");

                if resource_path.exists() {
                    std::fs::copy(resource_path, eng_path)?;
                }
            }
        }

        #[cfg(target_os = "macos")]
        {
            let _ = data_path; // Ensure tessdata directory exists but don't copy anything
        }

        Ok(())
    }

    pub fn are_system_languages_installed(app: &tauri::AppHandle) -> SnappitResult<bool> {
        // On macOS, we use Vision for auto mode, so we don't need Tesseract languages
        // to be installed for system languages
        #[cfg(target_os = "macos")]
        {
            let _ = app;
            return Ok(true);
        }

        // On other platforms, check if system languages are installed for Tesseract
        #[cfg(not(target_os = "macos"))]
        {
            let data_path = Self::get_data_path(app)?;
            let system_langs = get_system_recognition_languages();

            for lang in system_langs {
                let file_path = data_path.join(format!("{}.traineddata", lang));
                if !file_path.exists() {
                    return Ok(false);
                }
            }
            Ok(true)
        }
    }
}

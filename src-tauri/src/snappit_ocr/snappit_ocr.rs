use image::{ImageBuffer, Rgba};
use log::warn;

use crate::{
    snappit_errors::SnappitResult,
    snappit_ocr::{
        recognition_language::{
            get_system_recognition_languages, languages_match_system, resolve_recognition_language,
            split_recognition_languages,
        },
        SnappitMacOSVisionOcr, SnappitTesseractOcr,
    },
    traits::IntoDynamic,
};

pub struct SnappitOcr;

impl SnappitOcr {
    pub fn recognize(
        app: &tauri::AppHandle,
        image: ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> SnappitResult<String> {
        let dyn_img = (image.width(), image.height(), image.into_raw()).into_dynamic()?;
        let recognition_language = resolve_recognition_language(app)?;
        let language_codes = split_recognition_languages(&recognition_language);

        if Self::should_use_macos_vision(&language_codes) {
            match SnappitMacOSVisionOcr::recognize(app, &dyn_img, &language_codes) {
                Ok(text) => return Ok(text),
                Err(err) => {
                    warn!("macOS Vision OCR unavailable, falling back to Tesseract: {err}");
                }
            }
        }

        SnappitTesseractOcr::recognize(app, &dyn_img, &recognition_language)
    }

    fn should_use_macos_vision(languages: &[String]) -> bool {
        #[cfg(target_os = "macos")]
        {
            let system_languages = get_system_recognition_languages();
            languages_match_system(languages, &system_languages)
        }

        #[cfg(not(target_os = "macos"))]
        {
            let _ = languages;
            false
        }
    }
}

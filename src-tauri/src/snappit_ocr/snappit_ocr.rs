use image::{ImageBuffer, Rgba};
use log::warn;

use crate::{
    snappit_consts::SNAPPIT_CONSTS,
    snappit_errors::SnappitResult,
    snappit_ocr::{
        recognition_language::{
            get_system_recognition_languages, languages_match_system, resolve_recognition_language,
            split_recognition_languages,
        },
        SnappitMacOSVisionOcr, SnappitTesseractOcr,
    },
    snappit_res::{SnappitOcrEngine, SnappitOcrResult},
    snappit_store::SnappitStore,
    text_processing::{collapse_line_breaks, remove_non_spaced_script_spaces},
    traits::IntoDynamic,
};

pub struct SnappitOcr;

impl SnappitOcr {
    pub fn recognize(
        app: &tauri::AppHandle,
        image: ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> SnappitResult<SnappitOcrResult> {
        let dyn_img = (image.width(), image.height(), image.into_raw()).into_dynamic()?;
        let recognition_language = resolve_recognition_language(app)?;
        let language_codes = split_recognition_languages(&recognition_language);
        let keep_line_breaks = Self::get_keep_line_breaks(app);

        if Self::should_use_macos_vision(&language_codes) {
            match SnappitMacOSVisionOcr::recognize(app, &dyn_img, &language_codes) {
                Ok(text) => {
                    return Ok(SnappitOcrResult {
                        value: Self::process_text(&text, keep_line_breaks, false),
                        ocr: SnappitOcrEngine::Vision,
                    })
                }
                Err(err) => {
                    warn!("macOS Vision OCR unavailable, falling back to Tesseract: {err}");
                }
            }
        }

        let text = SnappitTesseractOcr::recognize(app, &dyn_img, &recognition_language)?;
        Ok(SnappitOcrResult {
            value: Self::process_text(&text, keep_line_breaks, true),
            ocr: SnappitOcrEngine::Tesseract,
        })
    }

    fn get_keep_line_breaks(app: &tauri::AppHandle) -> bool {
        SnappitStore::get_value(app, &SNAPPIT_CONSTS.store.keys.ocr_keep_line_breaks)
            .ok()
            .flatten()
            .and_then(|v| v.as_bool())
            .unwrap_or(true)
    }

    fn process_text(text: &str, keep_line_breaks: bool, is_tesseract: bool) -> String {
        let mut text = text.to_string();

        if is_tesseract {
            text = remove_non_spaced_script_spaces(&text);
        }

        if keep_line_breaks {
            return text;
        }

        collapse_line_breaks(&text)
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

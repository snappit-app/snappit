use image::DynamicImage;

use crate::snappit_errors::{SnappitError, SnappitResult};

pub struct SnappitMacOSVisionOcr;

impl SnappitMacOSVisionOcr {
    pub fn recognize(
        _app: &tauri::AppHandle,
        _img: &DynamicImage,
        _languages: &[String],
    ) -> SnappitResult<String> {
        // Placeholder for the macOS Vision OCR integration.
        Err(SnappitError::MacOSVisionOcrUnavailable)
    }
}

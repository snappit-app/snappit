pub mod commands;
pub mod recognition_language;
mod snappit_ocr;
mod tesseract_ocr;
mod vision_ocr;

pub use snappit_ocr::SnappitOcr;
pub use tesseract_ocr::SnappitTesseractOcr;
pub use vision_ocr::SnappitMacOSVisionOcr;

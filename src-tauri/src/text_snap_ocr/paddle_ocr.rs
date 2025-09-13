pub struct TextSnapPaddleOCR;
use std::{
    env,
    path::{Path, PathBuf},
};

use image::DynamicImage;
use paddle_ocr_rs::{ocr_lite::OcrLite, ocr_result::TextBlock};

use crate::text_snap_errors::{TextSnapError, TextSnapResult};

static CLS: &str = "ch_ppocr_mobile_v2.0_cls_infer.onnx";
static DET: &str = "PP-OCRv5_server_det_infer.onnx";
static REC: &str = "PP-OCRv5_server_rec_infer.onnx";

impl TextSnapPaddleOCR {
    pub fn recognize(img: &DynamicImage) -> TextSnapResult<String> {
        let rbg = img.clone().into_rgb8();
        let models_dir = Self::resolve_models_dir().ok_or(TextSnapError::ModelDirNotFound)?;

        let det = Self::first_existing(&models_dir, &[DET]);
        let cls = Self::first_existing(&models_dir, &[CLS]);
        let rec = Self::first_existing(&models_dir, &[REC]);

        let (det, cls, rec) = match (det, cls, rec) {
            (Some(d), Some(c), Some(r)) => (d, c, r),
            _ => return Err(TextSnapError::PaddleModelNotFound),
        };

        let mut ocr = OcrLite::new();
        let det_s = det.to_string_lossy().to_string();
        let cls_s = cls.to_string_lossy().to_string();
        let rec_s = rec.to_string_lossy().to_string();

        let dict: Option<PathBuf> = Self::first_existing(&models_dir, &["dict.txt"]);

        if let Some(dict_path) = dict {
            let dict_s = dict_path.to_string_lossy().to_string();
            log::info!("Initializing PaddleOCR with explicit dict: {}", dict_s);
            ocr.init_models_with_dict(&det_s, &cls_s, &rec_s, &dict_s, 2)?;
        } else {
            log::info!("Initializing PaddleOCR using model metadata (no dict file found)");
            ocr.init_models(&det_s, &cls_s, &rec_s, 2)?;
        }

        let mut res = ocr.detect(&rbg, 16, 1320, 0.6, 0.3, 1.5, true, true)?;

        log::info!("{:?}", res.text_blocks);

        let processed_text = Self::post_process_text(&mut res.text_blocks);

        Ok(processed_text)
    }

    fn first_existing(models_dir: &Path, names: &[&str]) -> Option<PathBuf> {
        for name in names {
            let p = models_dir.join(name);
            if p.exists() {
                return Some(p);
            }
        }
        None
    }

    fn resolve_models_dir() -> Option<PathBuf> {
        if let Ok(p) = env::var("PPOCR_MODELS_DIR") {
            let p = PathBuf::from(p);
            if p.exists() {
                return Some(p);
            }
        }

        let dev_path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("src")
            .join("text_snap_ocr")
            .join("paddle_ocr_models");

        if dev_path.exists() {
            return Some(dev_path);
        }

        if let Ok(exe) = std::env::current_exe() {
            if let Some(dir) = exe.parent() {
                let candidate = dir.join("resources").join("ocr");
                if candidate.exists() {
                    return Some(candidate);
                }
            }
        }

        None
    }

    fn post_process_text(blocks: &mut Vec<TextBlock>) -> String {
        blocks.sort_by_key(|b| b.box_points[0].y);

        let mut lines: Vec<String> = Vec::new();
        let mut current_line: Vec<String> = Vec::new();
        let mut last_y: i32 = -999;

        for b in blocks {
            let y = b.box_points[0].y as i32;
            if (y - last_y).abs() > 20 && !current_line.is_empty() {
                lines.push(current_line.join(" "));
                current_line = Vec::new();
            }
            current_line.push(
                b.text
                    .replace("','", ",")
                    .replace('\'', "")
                    .trim_matches(&['\'', '"'][..])
                    .to_string(),
            );
            last_y = y;
        }
        if !current_line.is_empty() {
            lines.push(current_line.join(" "));
        }

        let text = lines.join("\n");

        text
    }
}

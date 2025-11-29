use image::DynamicImage;
#[cfg(target_os = "macos")]
use image::ImageFormat;
#[cfg(target_os = "macos")]
use objc2::rc::Retained;
#[cfg(target_os = "macos")]
use objc2::runtime::AnyObject;
#[cfg(target_os = "macos")]
use objc2::{AnyThread, ClassType};
#[cfg(target_os = "macos")]
use objc2_foundation::{NSArray, NSData, NSDictionary, NSError, NSString};
#[cfg(target_os = "macos")]
use objc2_vision::{
    VNImageOption, VNImageRequestHandler, VNRecognizeTextRequest, VNRequestTextRecognitionLevel,
};
#[cfg(target_os = "macos")]
use std::io::Cursor;

use crate::snappit_errors::{SnappitError, SnappitResult};

pub struct SnappitMacOSVisionOcr;

impl SnappitMacOSVisionOcr {
    #[cfg(target_os = "macos")]
    pub fn recognize(
        _app: &tauri::AppHandle,
        img: &DynamicImage,
        languages: &[String],
    ) -> SnappitResult<String> {
        use objc2::rc::autoreleasepool;

        let png_bytes = encode_png(img)?;
        let vision_languages = normalize_languages(languages);
        let should_autodetect = vision_languages.is_empty();

        autoreleasepool(|_| -> SnappitResult<String> {
            let data = NSData::with_bytes(&png_bytes);
            let options: Retained<NSDictionary<VNImageOption, AnyObject>> = NSDictionary::new();
            let handler = VNImageRequestHandler::initWithData_options(
                VNImageRequestHandler::alloc(),
                &data,
                options.as_ref(),
            );

            let request = VNRecognizeTextRequest::new();
            request.setRecognitionLevel(VNRequestTextRecognitionLevel::Accurate);
            request.setUsesLanguageCorrection(true);
            request.setAutomaticallyDetectsLanguage(should_autodetect);

            if !vision_languages.is_empty() {
                let languages_array = nsstring_array(&vision_languages);
                request.setRecognitionLanguages(&languages_array);
            }

            let requests = NSArray::from_slice(&[request.as_super().as_super()]);
            handler
                .performRequests_error(&requests)
                .map_err(|err| vision_error(&err))?;

            Ok(extract_text(&request))
        })
    }

    #[cfg(not(target_os = "macos"))]
    pub fn recognize(
        _app: &tauri::AppHandle,
        _img: &DynamicImage,
        _languages: &[String],
    ) -> SnappitResult<String> {
        Err(SnappitError::MacOSVisionOcrUnavailable(
            "macOS Vision OCR is only available on macOS".into(),
        ))
    }
}

#[cfg(target_os = "macos")]
fn encode_png(img: &DynamicImage) -> SnappitResult<Vec<u8>> {
    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)?;
    Ok(buf)
}

#[cfg(target_os = "macos")]
fn normalize_languages(languages: &[String]) -> Vec<String> {
    let mut mapped: Vec<String> = Vec::new();

    for lang in languages {
        if let Some(mapped_code) = map_language_code(lang) {
            if !mapped
                .iter()
                .any(|existing| existing.eq_ignore_ascii_case(mapped_code))
            {
                mapped.push(mapped_code.to_string());
            }
        }
    }

    mapped
}

#[cfg(target_os = "macos")]
fn nsstring_array(codes: &[String]) -> Retained<NSArray<NSString>> {
    let retained: Vec<Retained<NSString>> =
        codes.iter().map(|code| NSString::from_str(code)).collect();

    let refs: Vec<&NSString> = retained.iter().map(|s| s.as_ref()).collect();
    NSArray::from_slice(&refs)
}

#[cfg(target_os = "macos")]
fn extract_text(request: &VNRecognizeTextRequest) -> String {
    let Some(observations) = request.results() else {
        return String::new();
    };

    let mut lines = Vec::new();

    for observation in observations.to_vec() {
        let candidates = observation.topCandidates(1);
        let top_candidate = candidates.to_vec().into_iter().next();

        if let Some(recognized) = top_candidate {
            let candidate_text = recognized.string().to_string();
            if !candidate_text.trim().is_empty() {
                lines.push(candidate_text);
            }
        }
    }

    lines.join("\n")
}

#[cfg(target_os = "macos")]
fn map_language_code(code: &str) -> Option<&'static str> {
    match code.to_ascii_lowercase().as_str() {
        "eng" => Some("en"),
        "rus" => Some("ru"),
        "chi_sim" => Some("zh-Hans"),
        "chi_tra" => Some("zh-Hant"),
        "jpn" => Some("ja"),
        "kor" => Some("ko"),
        "spa" => Some("es"),
        "fra" => Some("fr"),
        "deu" => Some("de"),
        "tha" => Some("th"),
        _ => None,
    }
}

#[cfg(target_os = "macos")]
fn vision_error(err: &NSError) -> SnappitError {
    let description = err.localizedDescription().to_string();
    let message = if description.is_empty() {
        "Vision request failed".to_string()
    } else {
        description
    };

    SnappitError::MacOSVisionOcrUnavailable(message)
}

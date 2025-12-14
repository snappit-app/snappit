use super::{
    recognition_language::get_system_recognition_languages, tesseract_ocr::SnappitTesseractOcr,
};
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct SystemLanguageInfo {
    pub code: String,
    pub name: String,
}

fn get_language_display_name(code: &str) -> String {
    match code {
        "eng" => "English".to_string(),
        "rus" => "Russian".to_string(),
        "chi_sim" => "Chinese (Simplified)".to_string(),
        "chi_tra" => "Chinese (Traditional)".to_string(),
        "jpn" => "Japanese".to_string(),
        "kor" => "Korean".to_string(),
        "spa" => "Spanish".to_string(),
        "fra" => "French".to_string(),
        "deu" => "German".to_string(),
        "tha" => "Thai".to_string(),
        _ => code.to_string(),
    }
}

#[tauri::command]
pub fn get_tess_languages(app: AppHandle) -> Result<Vec<String>, String> {
    let data_path = SnappitTesseractOcr::get_data_path(&app).map_err(|e| e.to_string())?;
    let mut languages = Vec::new();

    if data_path.exists() {
        let entries = std::fs::read_dir(data_path).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if let Some(extension) = path.extension() {
                if extension == "traineddata" {
                    if let Some(stem) = path.file_stem() {
                        if let Some(stem_str) = stem.to_str() {
                            languages.push(stem_str.to_string());
                        }
                    }
                }
            }
        }
    }
    Ok(languages)
}

#[tauri::command]
pub async fn download_tess_language(app: AppHandle, lang: String) -> Result<(), String> {
    let url = format!(
        "https://raw.githubusercontent.com/tesseract-ocr/tessdata/main/{}.traineddata",
        lang
    );
    let data_path = SnappitTesseractOcr::get_data_path(&app).map_err(|e| e.to_string())?;
    let file_path = data_path.join(format!("{}.traineddata", lang));

    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;

    let content = response.bytes().await.map_err(|e| e.to_string())?;
    std::fs::write(file_path, content).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_system_tess_languages() -> Vec<String> {
    get_system_recognition_languages()
}

#[tauri::command]
pub fn get_system_languages_info() -> Vec<SystemLanguageInfo> {
    get_system_recognition_languages()
        .into_iter()
        .map(|code| SystemLanguageInfo {
            name: get_language_display_name(&code),
            code,
        })
        .collect()
}

#[tauri::command]
pub fn is_macos() -> bool {
    cfg!(target_os = "macos")
}

#[tauri::command]
pub fn delete_tess_language(app: AppHandle, lang: String) -> Result<(), String> {
    // On non-macOS platforms, prevent deletion of system languages
    // On macOS, system languages can be deleted from Tesseract since Vision is used for auto mode
    #[cfg(not(target_os = "macos"))]
    {
        let system_langs = get_system_recognition_languages();
        if system_langs.contains(&lang) {
            return Err("Cannot delete system language".to_string());
        }
    }

    let data_path = SnappitTesseractOcr::get_data_path(&app).map_err(|e| e.to_string())?;
    let file_path = data_path.join(format!("{}.traineddata", lang));

    // On non-macOS platforms, prevent deleting the last language
    #[cfg(not(target_os = "macos"))]
    {
        let mut count = 0;
        if data_path.exists() {
            let entries = std::fs::read_dir(&data_path).map_err(|e| e.to_string())?;
            for entry in entries {
                let entry = entry.map_err(|e| e.to_string())?;
                let path = entry.path();
                if let Some(extension) = path.extension() {
                    if extension == "traineddata" {
                        count += 1;
                    }
                }
            }
        }

        if count <= 1 {
            return Err("Cannot delete the last language".to_string());
        }
    }

    if file_path.exists() {
        std::fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

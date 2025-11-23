use super::tesseract_ocr::SnappitTesseractOcr;
use tauri::AppHandle;

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
pub fn delete_tess_language(app: AppHandle, lang: String) -> Result<(), String> {
    let data_path = SnappitTesseractOcr::get_data_path(&app).map_err(|e| e.to_string())?;
    let file_path = data_path.join(format!("{}.traineddata", lang));

    if file_path.exists() {
        std::fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

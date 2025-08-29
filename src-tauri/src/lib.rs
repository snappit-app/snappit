mod platform;
mod region_capture;
mod snap_overlay;
mod text_snap_errors;
use base64::Engine;
use region_capture::{RegionCapture, RegionCaptureParams};
use snap_overlay::SnapOverlay;
use tauri::AppHandle;
use xcap::image::ImageEncoder;

#[tauri::command]
fn region_capture(app: AppHandle, params: RegionCaptureParams) -> tauri::Result<String> {
    let image = RegionCapture::capture(&app, params)?;
    let (width, height) = image.dimensions();
    let bytes = image.into_raw();

    let mut png_buf = Vec::new();
    let encoder = xcap::image::codecs::png::PngEncoder::new(&mut png_buf);
    encoder
        .write_image(&bytes, width, height, xcap::image::ColorType::Rgba8.into())
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    let b64 = base64::engine::general_purpose::STANDARD.encode(&png_buf);
    let data_url = format!("data:image/png;base64,{}", b64);
    Ok(data_url)
}

#[tauri::command]
fn show_snap_overlay(app: AppHandle) -> tauri::Result<()> {
    SnapOverlay.show(&app)?;
    Ok(())
}

fn preload_snap_overlay(app: &tauri::AppHandle) -> tauri::Result<()> {
    SnapOverlay.preload(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            preload_snap_overlay(app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![region_capture, show_snap_overlay])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

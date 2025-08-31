mod platform;
mod region_capture;
mod snap_overlay;
mod text_snap_errors;
use once_cell::sync::Lazy;
use region_capture::{RegionCapture, RegionCaptureParams};
use snap_overlay::SnapOverlay;
use std::sync::Mutex;
use tauri::{http::Response, AppHandle};

#[derive(Clone, Debug)]
struct ImageSlot {
    bytes: Vec<u8>,
    width: u32,
    height: u32,
}

static IMAGE: Lazy<Mutex<Option<ImageSlot>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
fn get_last_shot_dim() -> tauri::Result<Option<(u32, u32)>> {
    let guard = IMAGE.lock().unwrap();

    if let Some(img) = &*guard {
        return Ok(Some((img.width, img.height)));
    }

    Ok(None)
}

#[tauri::command]
fn region_capture(app: AppHandle, params: RegionCaptureParams) -> tauri::Result<()> {
    let image = RegionCapture::capture(&app, params)?;
    let (width, height) = image.dimensions();
    let bytes = image.into_raw();

    *IMAGE.lock().unwrap() = Some(ImageSlot {
        bytes,
        width,
        height,
    });
    Ok(())
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
        .register_uri_scheme_protocol("img", move |_app, req| {
            let guard = IMAGE.lock().unwrap();
            let origin = req
                .headers()
                .get("Origin")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("*");

            if let Some(img) = &*guard {
                return Response::builder()
                    .header("Cache-Control", "no-store")
                    .header("Content-Type", "application/octet-stream")
                    .header("Access-Control-Allow-Origin", origin)
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "*")
                    .header("Access-Control-Allow-Credentials", "true")
                    .status(200)
                    .body(img.bytes.clone())
                    .unwrap();
            }
            Response::builder().status(404).body(Vec::new()).unwrap()
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            preload_snap_overlay(app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            region_capture,
            show_snap_overlay,
            get_last_shot_dim
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

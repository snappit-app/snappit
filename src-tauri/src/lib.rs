mod region_capture;
mod snap_overlay;
use region_capture::{RegionCapture, RegionCaptureParams};
use snap_overlay::SnapOverlay;
use tauri::AppHandle;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn region_capture(params: RegionCaptureParams) -> tauri::Result<()> {
    log::info!("invoked");
    log::info!("region_capture called with params: {:?}", params);
    RegionCapture.capture(params);
    Ok(())
}

#[tauri::command]
fn show_snap_overlay(app: AppHandle) -> tauri::Result<()> {
    SnapOverlay.show(&app);
    Ok(())
}

fn preload_snap_overlay(app: &tauri::AppHandle) -> tauri::Result<()> {
    SnapOverlay.preload(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            preload_snap_overlay(app.handle())?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            region_capture,
            show_snap_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

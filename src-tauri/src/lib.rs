mod img_protocol;
mod platform;
mod region_capture;
mod text_snap_errors;
mod text_snap_overlay;
mod text_snap_shortcuts;
mod text_snap_tray;
use img_protocol::{handle_img_request, IMAGE};
use region_capture::{RegionCapture, RegionCaptureParams};
use tauri::AppHandle;
use text_snap_overlay::TextSnapOverlay;
use text_snap_tray::TextSnapTray;

use crate::img_protocol::ImageSlot;

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
    TextSnapOverlay.show(&app)?;
    Ok(())
}

fn preload_snap_overlay(app: &tauri::AppHandle) -> tauri::Result<()> {
    TextSnapOverlay.preload(app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .register_uri_scheme_protocol("img", move |_app, req| handle_img_request(&req))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            preload_snap_overlay(app.handle())?;
            TextSnapTray::init(app.handle())?;

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);
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

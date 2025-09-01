mod img_protocol;
mod platform;
mod region_capture;
mod text_snap_errors;
mod text_snap_overlay;
mod text_snap_settings;
mod text_snap_tray;

use img_protocol::{handle_img_request, IMAGE};
use region_capture::{RegionCapture, RegionCaptureParams};
use tauri::AppHandle;
use text_snap_overlay::TextSnapOverlay;
use text_snap_tray::TextSnapTray;

use crate::{img_protocol::ImageSlot, text_snap_settings::TextSnapSettings};

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
    TextSnapOverlay::show(&app)?;
    Ok(())
}

#[tauri::command]
fn hide_snap_overlay(app: AppHandle) -> tauri::Result<()> {
    TextSnapOverlay::hide(&app)?;
    Ok(())
}

#[tauri::command]
fn show_settings(app: AppHandle) -> tauri::Result<()> {
    TextSnapSettings::show(&app)?;
    Ok(())
}

#[tauri::command]
fn hide_settings(app: AppHandle) -> tauri::Result<()> {
    TextSnapSettings::hide(&app)?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .register_uri_scheme_protocol("img", move |_app, req| handle_img_request(&req))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            TextSnapOverlay::preload(app.handle())?;
            TextSnapSettings::preload(app.handle())?;

            TextSnapSettings::show(app.handle())?;
            // TextSnapSettings::hide(app.handle())?;

            // #[cfg(target_os = "macos")]
            // app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            TextSnapTray::init(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            region_capture,
            show_snap_overlay,
            hide_snap_overlay,
            show_settings,
            hide_settings,
            get_last_shot_dim
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

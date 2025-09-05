mod img_protocol;
mod platform;
mod region_capture;
mod text_snap_consts;
mod text_snap_errors;
mod text_snap_overlay;
mod text_snap_settings;
mod text_snap_store;
mod text_snap_tray;

use img_protocol::{handle_img_request, IMAGE};
use region_capture::{RegionCapture, RegionCaptureParams};
use serde_json::json;
use tauri::AppHandle;
use text_snap_overlay::TextSnapOverlay;
use text_snap_tray::TextSnapTray;

use crate::{
    img_protocol::ImageSlot, text_snap_consts::TEXT_SNAP_CONSTS,
    text_snap_settings::TextSnapSettings, text_snap_store::TextSnapStore,
    text_snap_tray::TextSnapTrayItemId,
};

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

#[tauri::command]
fn update_tray_shortcut(app: AppHandle) -> tauri::Result<()> {
    let shortcut =
        TextSnapStore::get_value(&app, TEXT_SNAP_CONSTS.store.keys.hotkey_capture.as_str())?
            .and_then(|v| v.as_str().map(|s| s.to_string()));

    TextSnapTray::update_shortcut(&app, TextSnapTrayItemId::Capture, shortcut.as_deref())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
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

            let initialized = TextSnapStore::get_value(
                app.handle(),
                TEXT_SNAP_CONSTS.store.keys.settings_initialized.as_str(),
            )?
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

            if !initialized {
                TextSnapSettings::hide(app.handle())?;
            } else {
                TextSnapStore::set_value(
                    app.handle(),
                    TEXT_SNAP_CONSTS.store.keys.settings_initialized.as_str(),
                    Some(json!(true)),
                )?;
            }

            TextSnapTray::init(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            region_capture,
            show_snap_overlay,
            hide_snap_overlay,
            show_settings,
            hide_settings,
            get_last_shot_dim,
            update_tray_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod platform;
mod region_capture;
mod text_snap_consts;
mod text_snap_errors;
mod text_snap_ocr;
mod text_snap_overlay;
mod text_snap_qr;
mod text_snap_settings;
mod text_snap_store;
mod text_snap_tray;
mod traits;

use region_capture::{RegionCapture, RegionCaptureParams};
use serde_json::json;
use std::env;
use tauri::AppHandle;
use text_snap_overlay::TextSnapOverlay;
use text_snap_tray::TextSnapTray;

use crate::{
    text_snap_consts::TEXT_SNAP_CONSTS, text_snap_ocr::TextSnapOcr, text_snap_qr::TextSnapQr,
    text_snap_settings::TextSnapSettings, text_snap_store::TextSnapStore,
    text_snap_tray::TextSnapTrayItemId,
};

#[tauri::command]
fn recognize_region_text(app: AppHandle, params: RegionCaptureParams) -> tauri::Result<String> {
    let image = RegionCapture::capture(&app, params)?;
    let text = TextSnapOcr::recognize(&app, image)?;

    Ok(text)
}

#[tauri::command]
fn scan_region_qr(app: AppHandle, params: RegionCaptureParams) -> tauri::Result<Option<String>> {
    let image = RegionCapture::capture(&app, params)?;
    let result = TextSnapQr::scan(image)?;

    Ok(result)
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

            if initialized {
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
            show_snap_overlay,
            hide_snap_overlay,
            show_settings,
            hide_settings,
            update_tray_shortcut,
            recognize_region_text,
            scan_region_qr,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

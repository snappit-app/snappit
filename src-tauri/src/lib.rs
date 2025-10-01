mod img_protocol;
mod platform;
mod region_capture;
mod text_snap_color_dropper;
mod text_snap_consts;
mod text_snap_errors;
mod text_snap_ocr;
mod text_snap_overlay;
mod text_snap_permissions;
mod text_snap_qr;
mod text_snap_res;
mod text_snap_settings;
mod text_snap_store;
mod text_snap_tray;
mod traits;

use region_capture::{RegionCapture, RegionCaptureParams};
use serde_json::json;
use tauri::{async_runtime::spawn_blocking, AppHandle};
use text_snap_overlay::TextSnapOverlay;
use text_snap_tray::TextSnapTray;

use crate::{
    img_protocol::{handle_img_request, ImageSlot, IMAGE},
    text_snap_color_dropper::{TextSnapColorDropper, TextSnapColorInfo},
    text_snap_consts::TEXT_SNAP_CONSTS,
    text_snap_errors::{TextSnapError, TextSnapResult},
    text_snap_ocr::TextSnapOcr,
    text_snap_permissions::{TextSnapPermissions, TextSnapPermissionsState},
    text_snap_qr::TextSnapQr,
    text_snap_res::TextSnapResponse,
    text_snap_settings::TextSnapSettings,
    text_snap_store::TextSnapStore,
    text_snap_tray::TextSnapTrayItemId,
    traits::into_dynamic::IntoPngByes,
};

#[tauri::command]
async fn capture_color_at_cursor(
    app: AppHandle,
    x: u32,
    y: u32,
) -> tauri::Result<TextSnapColorInfo> {
    let app_handle = app.clone();

    let color_info = spawn_blocking(move || -> TextSnapResult<_> {
        TextSnapColorDropper::capture_color_at_cursor(&app_handle, x, y)
    })
    .await??;

    Ok(color_info)
}

#[tauri::command]
async fn capture_magnified_view(app: AppHandle, x: u32, y: u32) -> tauri::Result<()> {
    let app_handle = app.clone();

    let image_data = spawn_blocking(move || -> TextSnapResult<_> {
        TextSnapColorDropper::capture_magnified_view(&app_handle, x, y)
    })
    .await??;

    let (width, height) = image_data.dimensions();
    let bytes = image_data.into_png_bytes()?;

    *IMAGE.lock().unwrap() = Some(ImageSlot {
        bytes,
        width,
        height,
    });
    Ok(())
}

#[tauri::command]
fn get_last_shot_dim() -> tauri::Result<Option<(u32, u32)>> {
    let guard = IMAGE.lock().unwrap();

    if let Some(img) = &*guard {
        return Ok(Some((img.width, img.height)));
    }

    Ok(None)
}

#[tauri::command]
fn get_permissions_state(app: AppHandle) -> tauri::Result<TextSnapPermissionsState> {
    Ok(TextSnapPermissions::refresh_and_emit(&app)?)
}

#[tauri::command]
fn request_screen_recording_permission(
    app: AppHandle,
) -> tauri::Result<TextSnapPermissionsState> {
    Ok(TextSnapPermissions::request_screen_recording(&app)?)
}

#[tauri::command]
fn open_screen_recording_settings(app: AppHandle) -> tauri::Result<()> {
    TextSnapPermissions::open_screen_recording_settings(&app)?;
    Ok(())
}

#[tauri::command]
async fn on_smart_tool(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<TextSnapResponse> {
    let app_handle = app.clone();

    let captured = spawn_blocking(move || -> TextSnapResult<_> {
        RegionCapture::capture(&app_handle, params)
    })
    .await??;

    let img_for_qr = captured.clone();
    let img_for_ocr = captured;
    let app_for_ocr = app.clone();

    let qr_handle =
        spawn_blocking(move || -> TextSnapResult<_> { Ok(TextSnapQr::scan(img_for_qr)?) });
    let ocr_handle = spawn_blocking(move || -> TextSnapResult<_> {
        TextSnapOcr::recognize(&app_for_ocr, img_for_ocr)
    });

    match qr_handle.await?? {
        Some(qr) => Ok(TextSnapResponse::Qr(Some(qr))),
        None => {
            let text = ocr_handle.await??;
            Ok(TextSnapResponse::Ocr(text))
        }
    }
}

#[tauri::command]
async fn recognize_region_text(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<TextSnapResponse> {
    let app_handle = app.clone();

    let task = spawn_blocking(move || -> TextSnapResult<_> {
        let image = RegionCapture::capture(&app_handle, params)?;
        TextSnapOcr::recognize(&app, image)
    });

    let ocr_result = task.await??;

    Ok(TextSnapResponse::Ocr(ocr_result))
}

#[tauri::command]
async fn scan_region_qr(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<TextSnapResponse> {
    let app_handle = app.clone();

    let task = spawn_blocking(move || -> TextSnapResult<_> {
        let image = RegionCapture::capture(&app_handle, params)?;
        TextSnapQr::scan(image)
    });

    let qr_result = task.await??;

    Ok(TextSnapResponse::Qr(qr_result))
}

#[tauri::command]
fn show_snap_overlay(app: AppHandle) -> tauri::Result<()> {
    match TextSnapOverlay::show(&app) {
        Ok(_) => Ok(()),
        Err(TextSnapError::MissingPermissions(_)) => Ok(()),
        Err(err) => Err(err.into()),
    }
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
        .register_uri_scheme_protocol("img", move |_app, req| handle_img_request(&req))
        .setup(|app| {
            TextSnapOverlay::preload(app.handle())?;
            TextSnapSettings::preload(app.handle())?;
            TextSnapSettings::show(app.handle())?;
            TextSnapPermissions::refresh_and_emit(app.handle())?;

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
            on_smart_tool,
            capture_color_at_cursor,
            capture_magnified_view,
            get_last_shot_dim,
            get_permissions_state,
            request_screen_recording_permission,
            open_screen_recording_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

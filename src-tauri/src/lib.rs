mod img_protocol;
mod platform;
mod region_capture;
mod snappit_consts;
mod snappit_errors;
mod snappit_ocr;
mod snappit_overlay;
mod snappit_permissions;
mod snappit_qr;
mod snappit_res;
mod snappit_screen_capture;
mod snappit_settings;
mod snappit_store;
mod snappit_tray;
mod traits;

use region_capture::{RegionCapture, RegionCaptureParams};
use serde_json::json;
use snappit_overlay::SnappitOverlay;
use snappit_tray::SnappitTray;
use tauri::{async_runtime::spawn_blocking, AppHandle};

use crate::{
    img_protocol::{handle_img_request, ImageSlot, IMAGE},
    snappit_consts::SNAPPIT_CONSTS,
    snappit_errors::{SnappitError, SnappitResult},
    snappit_ocr::SnappitOcr,
    snappit_overlay::SnappitOverlayTarget,
    snappit_permissions::{SnappitPermissions, SnappitPermissionsState},
    snappit_qr::SnappitQr,
    snappit_res::SnappitResponse,
    snappit_screen_capture::{SnappitColorInfo, SnappitScreenCapture},
    snappit_settings::SnappitSettings,
    snappit_store::SnappitStore,
    traits::into_dynamic::IntoPngByes,
};

#[tauri::command]
async fn capture_color_at_cursor(
    app: AppHandle,
    x: u32,
    y: u32,
) -> tauri::Result<SnappitColorInfo> {
    let app_handle = app.clone();

    let color_info = spawn_blocking(move || -> SnappitResult<_> {
        SnappitScreenCapture::capture_color_at_cursor(&app_handle, x, y)
    })
    .await??;

    Ok(color_info)
}

#[tauri::command]
async fn capture_magnified_view(app: AppHandle, x: u32, y: u32) -> tauri::Result<()> {
    let app_handle = app.clone();

    let image_data = spawn_blocking(move || -> SnappitResult<_> {
        SnappitScreenCapture::capture_magnified_view(&app_handle, x, y)
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
fn get_permissions_state(app: AppHandle) -> tauri::Result<SnappitPermissionsState> {
    Ok(SnappitPermissions::refresh_and_emit(&app)?)
}

#[tauri::command]
fn request_screen_recording_permission(app: AppHandle) -> tauri::Result<SnappitPermissionsState> {
    Ok(SnappitPermissions::request_screen_recording(&app)?)
}

#[tauri::command]
fn open_screen_recording_settings(app: AppHandle) -> tauri::Result<()> {
    SnappitPermissions::open_screen_recording_settings(&app)?;
    Ok(())
}

#[tauri::command]
async fn on_smart_tool(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<SnappitResponse> {
    let app_handle = app.clone();

    let captured =
        spawn_blocking(move || -> SnappitResult<_> { RegionCapture::capture(&app_handle, params) })
            .await??;

    let img_for_qr = captured.clone();
    let img_for_dropper = captured.clone();
    let img_for_ocr = captured;
    let app_for_ocr = app.clone();
    let app_for_dropper = app.clone();

    let qr_handle =
        spawn_blocking(move || -> SnappitResult<_> { Ok(SnappitQr::scan(img_for_qr)?) });
    let ocr_handle = spawn_blocking(move || -> SnappitResult<_> {
        SnappitOcr::recognize(&app_for_ocr, img_for_ocr)
    });
    let dropper_handle = spawn_blocking(move || -> SnappitResult<_> {
        SnappitScreenCapture::capture_color_at_img(&app_for_dropper, img_for_dropper)
    });

    if let Some(qr) = qr_handle.await?? {
        return Ok(SnappitResponse::Qr(Some(qr)));
    }

    let text = ocr_handle.await??;
    if !text.is_empty() {
        return Ok(SnappitResponse::Ocr(text));
    }

    let color = dropper_handle.await??;
    Ok(SnappitResponse::Dropper(color))
}

#[tauri::command]
async fn recognize_region_text(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<SnappitResponse> {
    let app_handle = app.clone();

    let task = spawn_blocking(move || -> SnappitResult<_> {
        let image = RegionCapture::capture(&app_handle, params)?;
        SnappitOcr::recognize(&app, image)
    });

    let ocr_result = task.await??;

    Ok(SnappitResponse::Ocr(ocr_result))
}

#[tauri::command]
async fn scan_region_qr(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<SnappitResponse> {
    let app_handle = app.clone();

    let task = spawn_blocking(move || -> SnappitResult<_> {
        let image = RegionCapture::capture(&app_handle, params)?;
        SnappitQr::scan(image)
    });

    let qr_result = task.await??;

    Ok(SnappitResponse::Qr(qr_result))
}

#[tauri::command]
fn show_snap_overlay(app: AppHandle, target: SnappitOverlayTarget) -> tauri::Result<()> {
    match SnappitOverlay::show(&app, target) {
        Ok(_) => Ok(()),
        Err(SnappitError::MissingPermissions(_)) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

#[tauri::command]
fn hide_snap_overlay(app: AppHandle) -> tauri::Result<()> {
    SnappitOverlay::hide(&app)?;
    Ok(())
}

#[tauri::command]
fn show_settings(app: AppHandle) -> tauri::Result<()> {
    SnappitSettings::show(&app)?;
    Ok(())
}

#[tauri::command]
fn hide_settings(app: AppHandle) -> tauri::Result<()> {
    SnappitSettings::hide(&app)?;
    Ok(())
}

#[tauri::command]
fn update_tray_shortcut(app: AppHandle, target: SnappitOverlayTarget) -> tauri::Result<()> {
    SnappitTray::update_overlay_shortcut(&app, target)?;
    Ok(())
}

#[tauri::command]
fn update_tray_shortcuts(app: AppHandle) -> tauri::Result<()> {
    SnappitTray::update_overlay_shortcuts(&app)?;
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
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_nspanel::init())
        .register_uri_scheme_protocol("img", move |_app, req| handle_img_request(&req))
        .setup(|app| {
            SnappitOverlay::preload(app.handle())?;
            SnappitSettings::preload(app.handle())?;
            SnappitSettings::show(app.handle())?;
            SnappitPermissions::refresh_and_emit(app.handle())?;

            let initialized = SnappitStore::get_value(
                app.handle(),
                SNAPPIT_CONSTS.store.keys.settings_initialized.as_str(),
            )?
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

            if initialized {
                SnappitSettings::hide(app.handle())?;
            } else {
                SnappitStore::set_value(
                    app.handle(),
                    SNAPPIT_CONSTS.store.keys.settings_initialized.as_str(),
                    Some(json!(true)),
                )?;
            }

            SnappitTray::init(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_snap_overlay,
            hide_snap_overlay,
            show_settings,
            hide_settings,
            update_tray_shortcut,
            update_tray_shortcuts,
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

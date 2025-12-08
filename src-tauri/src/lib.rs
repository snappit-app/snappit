mod img_protocol;
mod platform;
mod region_capture;
mod snappit_consts;
mod snappit_errors;
mod snappit_license;
mod snappit_notifications;
mod snappit_ocr;
mod snappit_overlay;
mod snappit_permissions;
mod snappit_qr;
mod snappit_res;
mod snappit_screen_capture;
mod snappit_settings;
mod snappit_shortcut_manager;
mod snappit_store;
mod snappit_tray;
mod traits;

use region_capture::{RegionCapture, RegionCaptureParams};
use snappit_notifications::{SnappitNotificationPayload, SnappitNotifications};
use snappit_overlay::SnappitOverlay;
use snappit_shortcut_manager::SnappitShortcutManager;
use snappit_tray::SnappitTray;
use tauri::{async_runtime::spawn_blocking, AppHandle};

use crate::{
    img_protocol::{handle_img_request, ImageSlot, IMAGE},
    snappit_errors::{SnappitError, SnappitResult},
    snappit_license::{LicenseState, SnappitLicense},
    snappit_ocr::{
        commands::{
            delete_tess_language, download_tess_language, get_system_tess_languages,
            get_tess_languages,
        },
        SnappitOcr, SnappitTesseractOcr,
    },
    snappit_overlay::SnappitOverlayTarget,
    snappit_permissions::{SnappitPermissions, SnappitPermissionsState},
    snappit_qr::SnappitQr,
    snappit_res::SnappitResponse,
    snappit_screen_capture::{SnappitColorInfo, SnappitScreenCapture},
    snappit_settings::SnappitSettings,
    traits::into_dynamic::IntoPngByes,
};

#[tauri::command]
async fn capture_color_at_cursor(
    app: AppHandle,
    x: u32,
    y: u32,
) -> tauri::Result<SnappitColorInfo> {
    SnappitLicense::consume_use()?;
    let _ = SnappitTray::update_license_status(&app);

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
async fn on_capture(app: AppHandle, params: RegionCaptureParams) -> tauri::Result<SnappitResponse> {
    SnappitLicense::consume_use()?;
    let _ = SnappitTray::update_license_status(&app);

    let app_handle = app.clone();

    let captured =
        spawn_blocking(move || -> SnappitResult<_> { RegionCapture::capture(&app_handle, params) })
            .await??;

    let img_for_qr = captured.clone();
    let img_for_ocr = captured;
    let app_for_ocr = app.clone();

    let qr_handle =
        spawn_blocking(move || -> SnappitResult<_> { Ok(SnappitQr::scan(img_for_qr)?) });
    let ocr_handle = spawn_blocking(move || -> SnappitResult<_> {
        SnappitOcr::recognize(&app_for_ocr, img_for_ocr)
    });

    if let Some(qr) = qr_handle.await?? {
        return Ok(SnappitResponse::Qr(Some(qr)));
    }

    let text = ocr_handle.await??;
    Ok(SnappitResponse::Ocr(text))
}

#[tauri::command]
async fn scan_region_qr(
    app: AppHandle,
    params: RegionCaptureParams,
) -> tauri::Result<SnappitResponse> {
    // Check license before QR scan
    SnappitLicense::consume_use()?;
    let _ = SnappitTray::update_license_status(&app);

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
    if !SnappitTesseractOcr::are_system_languages_installed(&app).unwrap_or(false) {
        SnappitSettings::show(&app)?;
        return Ok(());
    }

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
fn show_notification(app: AppHandle, payload: SnappitNotificationPayload) -> tauri::Result<()> {
    SnappitNotifications::show(&app, payload)?;
    Ok(())
}

#[tauri::command]
fn hide_notification(app: AppHandle) -> tauri::Result<()> {
    SnappitNotifications::hide(&app)?;
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
fn sync_shortcut(app: AppHandle, target: SnappitOverlayTarget) -> tauri::Result<()> {
    SnappitShortcutManager::sync_target(&app, target)?;
    SnappitTray::update_overlay_shortcut(&app, target)?;
    Ok(())
}

#[tauri::command]
fn read_config() -> tauri::Result<()> {
    match std::fs::read_to_string("asdasdasd.json") {
        Ok(_) => Ok(()),
        Err(err) => Err(err.into()),
    }
}

#[tauri::command]
fn get_license_state() -> tauri::Result<LicenseState> {
    Ok(SnappitLicense::get_state()?)
}

#[tauri::command]
fn consume_tool_use() -> tauri::Result<u32> {
    Ok(SnappitLicense::consume_use()?)
}

#[tauri::command]
fn activate_pro_license() -> tauri::Result<()> {
    SnappitLicense::activate_pro()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> tauri::Result<()> {
    return tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_nspanel::init())
        .register_uri_scheme_protocol("img", move |_app, req| handle_img_request(&req))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            #[cfg(not(debug_assertions))]
            app.handle()
                .set_activation_policy(tauri::ActivationPolicy::Accessory)?;

            SnappitTesseractOcr::ensure_initialized(app.handle())?;

            SnappitOverlay::preload(app.handle())?;
            SnappitNotifications::preload(app.handle())?;
            SnappitSettings::preload(app.handle())?;
            SnappitSettings::show(app.handle())?;
            SnappitPermissions::refresh_and_emit(app.handle())?;

            let permissions = SnappitPermissions::ensure_for_overlay(app.handle()).unwrap_or(
                SnappitPermissionsState {
                    screen_recording: false,
                },
            );

            if permissions.all_granted() {
                SnappitSettings::hide(app.handle())?;
            }

            SnappitShortcutManager::sync_all(app.handle())?;
            SnappitTray::init(app.handle())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_snap_overlay,
            hide_snap_overlay,
            show_notification,
            hide_notification,
            show_settings,
            hide_settings,
            scan_region_qr,
            on_capture,
            capture_color_at_cursor,
            capture_magnified_view,
            get_last_shot_dim,
            get_permissions_state,
            request_screen_recording_permission,
            open_screen_recording_settings,
            sync_shortcut,
            read_config,
            get_tess_languages,
            download_tess_language,
            delete_tess_language,
            get_system_tess_languages,
            get_license_state,
            consume_tool_use,
            activate_pro_license,
        ])
        .run(tauri::generate_context!());
}

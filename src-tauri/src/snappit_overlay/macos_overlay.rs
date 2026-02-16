use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult};
use objc2::rc::{autoreleasepool, Retained as ObjcRetained};
use objc2_app_kit::{NSRunningApplication, NSWorkspace};
use once_cell::sync::Lazy;
use tauri::{AppHandle, Error as TauriError, Manager, WebviewUrl, WebviewWindow, Wry};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelHandle, PanelLevel, StyleMask,
};

tauri_panel! {
    panel!(SnapOverlayPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })
}

static PREVIOUS_FOREGROUND_APP: Lazy<Mutex<Option<ObjcRetained<NSRunningApplication>>>> =
    Lazy::new(|| Mutex::new(None));

pub fn remember_previous_app(overlay_was_visible: bool) {
    if overlay_was_visible {
        return;
    }

    unsafe {
        autoreleasepool(|_| {
            let workspace = NSWorkspace::sharedWorkspace();
            let current_app = NSRunningApplication::currentApplication();

            let mut slot = PREVIOUS_FOREGROUND_APP.lock().unwrap();
            if let Some(front_app) = workspace.frontmostApplication() {
                if front_app == current_app {
                    slot.take();
                } else {
                    *slot = Some(front_app);
                }
            } else {
                slot.take();
            }
        });
    }
}

pub fn prepare_for_resize(app: &AppHandle<Wry>, _overlay: &WebviewWindow) {
    if let Ok((panel, _)) = get_overlay_handles(app) {
        panel.set_alpha_value(0.0);
    }
}

pub fn show_overlay(app: &AppHandle<Wry>, overlay: &WebviewWindow) -> SnappitResult<()> {
    let (panel, _) = get_overlay_handles(app)?;
    overlay.show()?;
    panel.show_and_make_key();
    Ok(())
}

pub fn hide_overlay(app: &AppHandle<Wry>, overlay: &WebviewWindow) -> SnappitResult<()> {
    let (panel, _) = get_overlay_handles(app)?;
    panel.hide();
    overlay.hide()?;
    Ok(())
}

pub fn finalize_after_layout(app: &AppHandle<Wry>) {
    let app_clone = app.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(50));
        let app_inner = app_clone.clone();
        let _ = app_clone.run_on_main_thread(move || {
            if let Ok((panel, _)) = get_overlay_handles(&app_inner) {
                panel.set_alpha_value(1.0);
            }
        });
    });
}

pub fn get_overlay_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    let (_, window) = get_overlay_handles(app)?;
    Ok(window)
}

pub fn ensure_overlay_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    let (_, window) = ensure_overlay_handles(app)?;
    Ok(window)
}

fn get_overlay_handles(app: &AppHandle<Wry>) -> SnappitResult<(PanelHandle<Wry>, WebviewWindow)> {
    let label = SNAPPIT_CONSTS.windows.overlay.as_str();
    let panel = app
        .get_webview_panel(label)
        .map_err(|_| TauriError::WebviewNotFound)?;
    let window = app
        .get_webview_window(label)
        .ok_or_else(|| TauriError::WebviewNotFound)?;

    Ok((panel, window))
}

fn ensure_overlay_handles(
    app: &AppHandle<Wry>,
) -> SnappitResult<(PanelHandle<Wry>, WebviewWindow)> {
    let label = SNAPPIT_CONSTS.windows.overlay.as_str();
    let panel = match app.get_webview_panel(label) {
        Ok(panel) => panel,
        Err(_) => builder(app).build()?,
    };

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| TauriError::WebviewNotFound)?;

    Ok((panel, window))
}

fn builder<'a>(app: &'a AppHandle<Wry>) -> PanelBuilder<'a, Wry, SnapOverlayPanel> {
    PanelBuilder::<_, SnapOverlayPanel>::new(app, SNAPPIT_CONSTS.windows.overlay.as_str())
        .url(WebviewUrl::App("apps/snap_overlay/index.html".into()))
        .title(SNAPPIT_CONSTS.windows.overlay.as_str())
        .level(PanelLevel::ScreenSaver)
        .floating(true)
        .transparent(true)
        .opaque(false)
        .has_shadow(false)
        .collection_behavior(
            CollectionBehavior::new()
                .move_to_active_space()
                .full_screen_auxiliary()
                .ignores_cycle(),
        )
        .style_mask(StyleMask::empty().borderless().nonactivating_panel())
        .with_window(|window| {
            window
                .visible(false)
                .accept_first_mouse(true)
                .fullscreen(false)
                .shadow(false)
                .focusable(false)
                .always_on_top(true)
                .content_protected(true)
                .skip_taskbar(true)
                .closable(false)
                .decorations(false)
                .transparent(true)
                .resizable(false)
        })
}

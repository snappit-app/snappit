use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread::{self};
use std::time::Duration;

use crate::snappit_errors::{SnappitResult, SnappitResultExt};
use crate::snappit_settings::SnappitSettings;
use crate::snappit_shortcut_manager::SnappitShortcutManager;
use crate::{
    platform::Platform, snappit_consts::SNAPPIT_CONSTS, snappit_permissions::SnappitPermissions,
};
use ::serde::{Deserialize, Serialize};
use colored::Colorize;
#[cfg(target_os = "macos")]
use objc2::rc::{autoreleasepool, Retained as ObjcRetained};
#[cfg(target_os = "macos")]
use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication, NSWorkspace};
use once_cell::sync::Lazy;
use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, Monitor, WebviewUrl, WebviewWindow, Wry,
};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelHandle, PanelLevel, StyleMask,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SnappitOverlayTarget {
    Capture,
    DigitalRuler,
    ColorDropper,
    QrScanner,
    None,
}

tauri_panel! {
    panel!(SnapOverlayPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })
}

pub struct SnappitOverlay;

static OVERLAY_LAST_MONITOR: Lazy<Mutex<Option<Monitor>>> = Lazy::new(|| Mutex::new(None));

static MONITOR_THREAD_RUNNING: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));

#[cfg(target_os = "macos")]
static PREVIOUS_FOREGROUND_APP: Lazy<Mutex<Option<ObjcRetained<NSRunningApplication>>>> =
    Lazy::new(|| Mutex::new(None));

impl SnappitOverlay {
    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = None;
        }

        Self::unsubscribe_monitor_changes();

        let (panel, overlay) = Self::get_overlay_handles(app)?;

        log::info!("{}", "snap_overlay hidden".blue());
        overlay.emit("snap_overlay:hidden", true)?;
        panel.hide();
        overlay.hide()?;
        #[cfg(target_os = "macos")]
        Self::restore_previous_app_focus();
        SnappitShortcutManager::unregister_hide(app)?;

        Ok(overlay)
    }

    pub fn show(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<WebviewWindow> {
        Self::subscribe_monitor_changes(app);
        Self::actual_show(app, target)
    }

    fn actual_show(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<WebviewWindow> {
        SnappitPermissions::ensure_for_overlay(app)?;

        let monitor = Platform::monitor_from_cursor(&app)?;
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = Some(monitor.clone());
        }

        let physical_size = monitor.size().clone();

        let (panel, overlay) = Self::ensure_overlay_handles(app)?;

        #[cfg(target_os = "macos")]
        let overlay_was_visible = overlay.is_visible().unwrap_or(false);
        #[cfg(target_os = "macos")]
        Self::remember_previous_app(overlay_was_visible);

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        if SnappitSettings::get_window(app)?.is_visible()? {
            SnappitSettings::hide(app)?;
        }

        overlay.show()?;
        panel.show_and_make_key();
        log::info!("{}", "snap_overlay shown".blue());

        overlay.emit("snap_overlay:shown", target)?;
        overlay.set_focus()?;
        SnappitShortcutManager::register_hide(app)?;

        Ok(overlay)
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let (_, window) = Self::ensure_overlay_handles(app)?;

        let monitor = Platform::monitor_from_cursor(&app)?;
        let physical_size = monitor.size().clone();
        window.set_size(physical_size)?;
        window.set_position(monitor.position().clone())?;

        Ok(window)
    }

    #[cfg(target_os = "macos")]
    fn remember_previous_app(overlay_was_visible: bool) {
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

    #[cfg(target_os = "macos")]
    fn restore_previous_app_focus() {
        let previous = {
            let mut slot = PREVIOUS_FOREGROUND_APP.lock().unwrap();
            slot.take()
        };

        let Some(previous_app) = previous else {
            return;
        };

        unsafe {
            autoreleasepool(|_| {
                if previous_app.isTerminated() {
                    return;
                }

                #[allow(deprecated)]
                let options = NSApplicationActivationOptions::ActivateAllWindows
                    | NSApplicationActivationOptions::ActivateIgnoringOtherApps;

                if !previous_app.activateWithOptions(options) {
                    log::warn!("snappit overlay: failed to restore previous focus");
                }
            });
        }
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> PanelBuilder<'a, Wry, SnapOverlayPanel> {
        PanelBuilder::<_, SnapOverlayPanel>::new(app, SNAPPIT_CONSTS.windows.overlay.as_str())
            .url(WebviewUrl::App("apps/snap_overlay/index.html".into()))
            .title(SNAPPIT_CONSTS.windows.overlay.as_str())
            .level(PanelLevel::PopUpMenu)
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
                    .always_on_top(true)
                    .content_protected(true)
                    .skip_taskbar(true)
                    .closable(false)
                    .decorations(false)
                    .transparent(true)
                    .resizable(false)
            })
    }

    fn get_overlay_handles(
        app: &AppHandle<Wry>,
    ) -> SnappitResult<(PanelHandle<Wry>, WebviewWindow)> {
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
            Err(_) => Self::builder(app).build()?,
        };

        let window = app
            .get_webview_window(label)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        Ok((panel, window))
    }

    fn subscribe_monitor_changes(app: &AppHandle<Wry>) {
        let app_handle = app.clone();
        MONITOR_THREAD_RUNNING.store(true, Ordering::SeqCst);

        thread::spawn(move || {
            while MONITOR_THREAD_RUNNING.load(Ordering::SeqCst) {
                if let Err(e) = Self::detect_monitor_changed(&app_handle) {
                    eprintln!("on_monitor_changes error: {:?}", e);
                }
                thread::sleep(Duration::from_millis(100));
            }
        });
    }

    fn unsubscribe_monitor_changes() {
        MONITOR_THREAD_RUNNING.store(false, Ordering::SeqCst);
    }

    fn detect_monitor_changed(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        let last_monitor = OVERLAY_LAST_MONITOR.lock().unwrap().clone();

        if let Some(last) = last_monitor {
            if monitor.position() != last.position() {
                let app_clone = app.clone();
                app.run_on_main_thread(move || {
                    Self::actual_show(&app_clone, SnappitOverlayTarget::None).log_on_err();
                })?;
            }
        }

        Ok(())
    }
}

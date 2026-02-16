use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use crate::platform::Platform;
use crate::snappit_errors::{SnappitError, SnappitResult, SnappitResultExt};
use crate::snappit_license::SnappitLicense;
use crate::snappit_permissions::SnappitPermissions;
use crate::snappit_settings::SnappitSettings;
use crate::snappit_shortcut_manager::SnappitShortcutManager;
use colored::Colorize;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Monitor, WebviewWindow, Wry};

#[cfg(target_os = "macos")]
use super::macos_overlay as platform_overlay;
#[cfg(not(target_os = "macos"))]
use super::multiplatform_overlay as platform_overlay;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SnappitOverlayTarget {
    Capture,
    DigitalRuler,
    ColorDropper,
    QrScanner,
    None,
}

pub struct SnappitOverlay;

static OVERLAY_LAST_MONITOR: Lazy<Mutex<Option<Monitor>>> = Lazy::new(|| Mutex::new(None));

static OVERLAY_CURRENT_TARGET: Lazy<Mutex<Option<SnappitOverlayTarget>>> =
    Lazy::new(|| Mutex::new(None));

static MONITOR_THREAD_RUNNING: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));

impl SnappitOverlay {
    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = None;
        }
        {
            let mut target = OVERLAY_CURRENT_TARGET.lock().unwrap();
            *target = None;
        }

        Self::unsubscribe_monitor_changes();

        let overlay = platform_overlay::ensure_overlay_window(app)?;

        log::info!("{}", "snap_overlay hidden".blue());
        overlay.emit("snap_overlay:hidden", true)?;

        platform_overlay::hide_overlay(app, &overlay)?;
        SnappitShortcutManager::unregister_hide(app)?;

        Ok(overlay)
    }

    pub fn show(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<WebviewWindow> {
        if SnappitLicense::is_trial_expired()? {
            log::info!(
                "{}",
                "Trial expired, redirecting to license settings".yellow()
            );
            SnappitSettings::show_tab(app, "license")?;
            return Err(SnappitError::TrialExpired);
        }

        let overlay = Self::actual_show(app, target)?;
        Self::subscribe_monitor_changes(app);

        Ok(overlay)
    }

    fn actual_show(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<WebviewWindow> {
        SnappitPermissions::ensure_for_overlay(app)?;

        let monitor = Platform::monitor_from_cursor(app)?;
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = Some(monitor.clone());
        }
        {
            let mut current_target = OVERLAY_CURRENT_TARGET.lock().unwrap();
            *current_target = Some(target);
        }

        let physical_size = monitor.size().clone();
        let overlay = platform_overlay::ensure_overlay_window(app)?;

        let overlay_was_visible = overlay.is_visible().unwrap_or(false);
        platform_overlay::remember_previous_app(overlay_was_visible);

        platform_overlay::prepare_for_resize(app, &overlay);

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        platform_overlay::show_overlay(app, &overlay)?;
        log::info!("{}", "snap_overlay shown".blue());

        overlay.emit("snap_overlay:shown", target)?;
        SnappitShortcutManager::register_hide(app)?;

        platform_overlay::finalize_after_layout(app);

        Ok(overlay)
    }

    pub fn get_current_target() -> Option<SnappitOverlayTarget> {
        let target = OVERLAY_CURRENT_TARGET.lock().unwrap();
        *target
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = platform_overlay::ensure_overlay_window(app)?;

        let monitor = Platform::monitor_from_cursor(app)?;
        let physical_size = monitor.size().clone();
        window.set_size(physical_size)?;
        window.set_position(monitor.position().clone())?;

        Ok(window)
    }

    fn subscribe_monitor_changes(app: &AppHandle<Wry>) {
        if MONITOR_THREAD_RUNNING
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            return;
        }

        let app_handle = app.clone();
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
        let monitor = Platform::monitor_from_cursor(app)?;
        let last_monitor = OVERLAY_LAST_MONITOR.lock().unwrap().clone();

        if let Some(last) = last_monitor {
            if monitor.position() != last.position() {
                let app_clone = app.clone();
                app.run_on_main_thread(move || {
                    Self::switch_monitor(&app_clone, monitor).log_on_err();
                })?;
            }
        }

        Ok(())
    }

    fn switch_monitor(app: &AppHandle<Wry>, monitor: Monitor) -> SnappitResult<()> {
        let overlay = platform_overlay::get_overlay_window(app)?;

        platform_overlay::prepare_for_resize(app, &overlay);

        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = Some(monitor.clone());
        }

        let physical_size = monitor.size().clone();
        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        overlay.emit("snap_overlay:monitor_changed", true)?;
        platform_overlay::finalize_after_layout(app);

        Ok(())
    }
}

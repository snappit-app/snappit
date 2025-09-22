use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use crate::text_snap_errors::TextSnapResult;
use crate::{platform::Platform, text_snap_consts::TEXT_SNAP_CONSTS};
#[cfg(target_os = "macos")]
use objc2_app_kit::NSScreenSaverWindowLevel;
use once_cell::sync::Lazy;
use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, Monitor, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};
pub struct TextSnapOverlay;

static OVERLAY_LAST_MONITOR: Lazy<Mutex<Option<Monitor>>> = Lazy::new(|| Mutex::new(None));

static MONITOR_THREAD_RUNNING: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));

impl TextSnapOverlay {
    pub fn hide(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = None;
        }

        Self::unsubscribe_monitor_changes();

        let overlay = app
            .get_webview_window(TEXT_SNAP_CONSTS.windows.overlay.as_str())
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        overlay.emit("snap_overlay:hidden", true)?;
        overlay.hide()?;

        let has_opened = app
            .webview_windows()
            .values()
            .any(|win| win.is_visible().unwrap_or(false) || win.is_minimized().unwrap_or(false));

        log::info!("{:?}", has_opened);

        if !has_opened {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;
        }

        Ok(overlay)
    }

    pub fn show(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = Some(monitor.clone());
        }

        Self::subscribe_monitor_changes(app);
        let physical_size = monitor.size().clone();
        let overlay = app
            .get_webview_window(TEXT_SNAP_CONSTS.windows.overlay.as_str())
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        #[cfg(target_os = "macos")]
        {
            // Platform::set_window_level(overlay.as_ref().window(), NSScreenSaverWindowLevel);
            app.set_activation_policy(tauri::ActivationPolicy::Regular)?;
        }

        overlay.show()?;
        overlay.emit("snap_overlay:shown", true)?;
        overlay.set_focus()?;

        Ok(overlay)
    }

    pub fn preload(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let window_builder = Self::builder(app)
            .fullscreen(false)
            .shadow(false)
            .always_on_top(false)
            .content_protected(true)
            .skip_taskbar(true)
            .closable(true)
            .decorations(false)
            .transparent(true)
            .visible(false);
        let window = window_builder.build()?;

        Ok(window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let builder = WebviewWindow::builder(
            app,
            TEXT_SNAP_CONSTS.windows.overlay.as_str(),
            WebviewUrl::App("apps/snap_overlay/index.html".into()),
        )
        .title(TEXT_SNAP_CONSTS.windows.overlay.as_str())
        .visible(false)
        .accept_first_mouse(true);

        builder
    }

    fn subscribe_monitor_changes(app: &AppHandle<Wry>) {
        let app_handle = app.clone();
        MONITOR_THREAD_RUNNING.store(true, Ordering::SeqCst);

        thread::spawn(move || {
            while MONITOR_THREAD_RUNNING.load(Ordering::SeqCst) {
                if let Err(e) = Self::detect_monitor_changed(&app_handle) {
                    eprintln!("on_monitor_changes error: {:?}", e);
                }
                thread::sleep(Duration::from_millis(150));
            }
        });
    }

    fn unsubscribe_monitor_changes() {
        MONITOR_THREAD_RUNNING.store(false, Ordering::SeqCst);
    }

    fn detect_monitor_changed(app: &AppHandle<Wry>) -> TextSnapResult<()> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        let last_monitor = OVERLAY_LAST_MONITOR.lock().unwrap().clone();

        if let Some(last) = last_monitor {
            if monitor.position() != last.position() {
                Self::show(app)?;
            }
        }

        Ok(())
    }
}

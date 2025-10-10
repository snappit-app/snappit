use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread::{self};
use std::time::Duration;

use crate::text_snap_errors::TextSnapResult;
use crate::text_snap_settings::TextSnapSettings;
use crate::{
    platform::Platform, text_snap_consts::TEXT_SNAP_CONSTS,
    text_snap_permissions::TextSnapPermissions,
};
use ::serde::{Deserialize, Serialize};
#[cfg(target_os = "macos")]
use once_cell::sync::Lazy;
use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, Monitor, WebviewUrl, WebviewWindow, Wry,
};
use tauri_nspanel::{tauri_panel, ManagerExt, PanelBuilder, PanelHandle, PanelLevel, StyleMask};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TextSnapOverlayTarget {
    SmartTool,
    TextCapture,
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

        let (panel, overlay) = Self::get_overlay_handles(app)?;

        log::info!("hidden");
        overlay.emit("snap_overlay:hidden", true)?;
        panel.hide();
        overlay.hide()?;

        let has_opened = app
            .webview_windows()
            .values()
            .any(|win| win.is_visible().unwrap_or(false) || win.is_minimized().unwrap_or(false));

        if !has_opened {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;
        }

        Ok(overlay)
    }

    pub fn show(
        app: &AppHandle<Wry>,
        target: TextSnapOverlayTarget,
    ) -> TextSnapResult<WebviewWindow> {
        Self::subscribe_monitor_changes(app);
        Self::actual_show(app, target)
    }

    fn actual_show(
        app: &AppHandle<Wry>,
        target: TextSnapOverlayTarget,
    ) -> TextSnapResult<WebviewWindow> {
        TextSnapPermissions::ensure_for_overlay(app)?;

        let monitor = Platform::monitor_from_cursor(&app)?;
        {
            let mut last = OVERLAY_LAST_MONITOR.lock().unwrap();
            *last = Some(monitor.clone());
        }

        let physical_size = monitor.size().clone();

        let (panel, overlay) = Self::ensure_overlay_handles(app)?;

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        if TextSnapSettings::get_window(app)?.is_visible()? {
            TextSnapSettings::hide(app)?;
        }

        #[cfg(target_os = "macos")]
        {
            // #[cfg(not(debug_assertions))]
            {
                Platform::set_window_level(
                    overlay.as_ref().window(),
                    objc2_app_kit::NSPopUpMenuWindowLevel,
                );
            }

            app.set_activation_policy(tauri::ActivationPolicy::Regular)?;
        }

        overlay.show()?;
        panel.show_and_make_key();
        log::info!("shown");
        overlay.emit("snap_overlay:shown", target)?;
        overlay.set_focus()?;

        Ok(overlay)
    }

    pub fn preload(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let (_, window) = Self::ensure_overlay_handles(app)?;

        let monitor = Platform::monitor_from_cursor(&app)?;
        let physical_size = monitor.size().clone();
        window.set_size(physical_size)?;
        window.set_position(monitor.position().clone())?;

        Ok(window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> PanelBuilder<'a, Wry, SnapOverlayPanel> {
        PanelBuilder::<_, SnapOverlayPanel>::new(app, TEXT_SNAP_CONSTS.windows.overlay.as_str())
            .url(WebviewUrl::App("apps/snap_overlay/index.html".into()))
            .title(TEXT_SNAP_CONSTS.windows.overlay.as_str())
            .level(PanelLevel::PopUpMenu)
            .floating(true)
            .transparent(true)
            .opaque(false)
            .has_shadow(false)
            .style_mask(StyleMask::empty().borderless())
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
    ) -> TextSnapResult<(PanelHandle<Wry>, WebviewWindow)> {
        let label = TEXT_SNAP_CONSTS.windows.overlay.as_str();
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
    ) -> TextSnapResult<(PanelHandle<Wry>, WebviewWindow)> {
        let label = TEXT_SNAP_CONSTS.windows.overlay.as_str();
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

    fn detect_monitor_changed(app: &AppHandle<Wry>) -> TextSnapResult<()> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        let last_monitor = OVERLAY_LAST_MONITOR.lock().unwrap().clone();

        if let Some(last) = last_monitor {
            if monitor.position() != last.position() {
                let app_clone = app.clone();
                app.run_on_main_thread(move || {
                    if let Err(err) = Self::actual_show(&app_clone, TextSnapOverlayTarget::None) {
                        log::error!(
                            "Failed to reposition overlay after monitor change: {:?}",
                            err
                        );
                    }
                })?;
            }
        }

        Ok(())
    }
}

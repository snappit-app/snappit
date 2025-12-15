use std::cmp;
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::Error as TauriError;
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindow, Wry};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelHandle, PanelLevel, StyleMask,
};
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

const EMIT_RETRY_ATTEMPTS: u32 = 3;
const EMIT_RETRY_DELAY_MS: u64 = 50;
const ANIMATION_DURATION: f64 = 0.2;

use crate::{
    platform::Platform, snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult,
    snappit_overlay::SnappitOverlayTarget, snappit_sounds::SnappitSounds,
};

const WINDOW_WIDTH: u32 = 320;
const WINDOW_HEIGHT: u32 = 220;
const WINDOW_BOTTOM_MARGIN: i32 = 400;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SnappitNotificationPayload {
    pub target: SnappitOverlayTarget,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
}

tauri_panel! {
    panel!(SnappitNotificationPanel {
        config: {
            can_become_key_window: false,
            is_floating_panel: true
        }
    })
}

pub struct SnappitNotifications;

impl SnappitNotifications {
    pub fn show(
        app: &AppHandle<Wry>,
        payload: SnappitNotificationPayload,
    ) -> SnappitResult<WebviewWindow> {
        let (panel, window) = Self::ensure_handles(app)?;

        let monitor = Platform::monitor_from_cursor(app)?;
        let width = WINDOW_WIDTH as i32;
        let height = WINDOW_HEIGHT as i32;

        let available_width = monitor.size().width as i32;
        let available_height = monitor.size().height as i32;

        let x_offset = cmp::max((available_width - width) / 2, 0);
        let y_offset = cmp::max(available_height - height - WINDOW_BOTTOM_MARGIN, 0);

        let x = monitor.position().x + x_offset;
        let y = monitor.position().y + y_offset;

        window.set_position(PhysicalPosition::new(x, y))?;

        #[cfg(target_os = "macos")]
        Self::set_window_alpha(&window, 0.0);

        panel.show();
        window.show()?;

        #[cfg(target_os = "macos")]
        Self::animate_window_alpha(&window, 1.0, ANIMATION_DURATION);

        Self::emit_with_retry(&window, "notification:shown", payload)?;
        SnappitSounds::play_capture(app);
        log::info!("shown");

        Ok(window)
    }

    pub fn animate_out(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let (_, window) = Self::ensure_handles(app)?;

        #[cfg(target_os = "macos")]
        Self::animate_window_alpha(&window, 0.0, ANIMATION_DURATION);

        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn set_window_alpha(window: &WebviewWindow, alpha: f64) {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_window = ns_window as *mut AnyObject;
                let _: () = msg_send![ns_window, setAlphaValue: alpha];
            }
        }
    }

    #[cfg(target_os = "macos")]
    fn animate_window_alpha(window: &WebviewWindow, alpha: f64, duration: f64) {
        use objc2::msg_send;
        use objc2::runtime::AnyObject;

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_window = ns_window as *mut AnyObject;

                let _: () = msg_send![objc2::class!(NSAnimationContext), beginGrouping];

                let animation_context: *mut AnyObject =
                    msg_send![objc2::class!(NSAnimationContext), currentContext];

                let _: () = msg_send![animation_context, setDuration: duration];

                let animator: *mut AnyObject = msg_send![ns_window, animator];
                let _: () = msg_send![animator, setAlphaValue: alpha];

                let _: () = msg_send![objc2::class!(NSAnimationContext), endGrouping];
            }
        }
    }

    fn emit_with_retry<S: serde::Serialize + Clone>(
        window: &WebviewWindow,
        event: &str,
        payload: S,
    ) -> SnappitResult<()> {
        for attempt in 0..EMIT_RETRY_ATTEMPTS {
            match window.emit(event, payload.clone()) {
                Ok(_) => return Ok(()),
                Err(e) => {
                    if attempt < EMIT_RETRY_ATTEMPTS - 1 {
                        log::warn!(
                            "Emit attempt {} failed for {}: {:?}, retrying...",
                            attempt + 1,
                            event,
                            e
                        );
                        thread::sleep(Duration::from_millis(EMIT_RETRY_DELAY_MS));
                    } else {
                        log::error!("All emit attempts failed for {}: {:?}", event, e);
                        return Err(e.into());
                    }
                }
            }
        }
        Ok(())
    }

    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let (panel, window) = Self::ensure_handles(app)?;

        window.emit("notification:hidden", true)?;
        log::info!("hidden");
        panel.hide();
        window.hide()?;

        Ok(window)
    }

    fn ensure_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let (_, window) = Self::ensure_handles(app)?;

        Ok(window)
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        Self::ensure_window(app)
    }

    fn ensure_handles(app: &AppHandle<Wry>) -> SnappitResult<(PanelHandle<Wry>, WebviewWindow)> {
        let label = SNAPPIT_CONSTS.windows.notification.as_str();

        let (panel, is_new) = match app.get_webview_panel(label) {
            Ok(panel) => (panel, false),
            Err(_) => (Self::builder(app).build()?, true),
        };

        let window = app
            .get_webview_window(label)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        let monitor = Platform::monitor_from_cursor(app)?;
        let width = WINDOW_WIDTH as i32;
        let height = WINDOW_HEIGHT as i32;
        let available_width = monitor.size().width as i32;
        let available_height = monitor.size().height as i32;
        let x_offset = cmp::max((available_width - width) / 2, 0);
        let y_offset = cmp::max(available_height - height - WINDOW_BOTTOM_MARGIN, 0);

        let x = monitor.position().x + x_offset;
        let y = monitor.position().y + y_offset;

        window.set_position(PhysicalPosition::new(x, y))?;

        #[cfg(target_os = "macos")]
        if is_new {
            apply_vibrancy(
                &window,
                NSVisualEffectMaterial::HudWindow,
                Some(NSVisualEffectState::Active),
                Some(30.0),
            )
            .expect("Failed to apply vibrancy");
        }

        Ok((panel, window))
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> PanelBuilder<'a, Wry, SnappitNotificationPanel> {
        PanelBuilder::<_, SnappitNotificationPanel>::new(
            app,
            SNAPPIT_CONSTS.windows.notification.as_str(),
        )
        .url(WebviewUrl::App("apps/notifications/index.html".into()))
        .title("")
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
        .no_activate(true)
        .with_window(|window| {
            window
                .visible(false)
                .fullscreen(false)
                .always_on_top(true)
                .content_protected(false)
                .closable(false)
                .decorations(false)
                .transparent(true)
                .resizable(false)
                .shadow(false)
                .focusable(false)
                .skip_taskbar(true)
                .inner_size(WINDOW_WIDTH.into(), WINDOW_HEIGHT.into())
        })
    }
}

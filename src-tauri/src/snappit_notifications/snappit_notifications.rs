use std::cmp;
use std::thread;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, PhysicalPosition, WebviewWindow, Wry};

use crate::{
    platform::Platform, snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult,
    snappit_overlay::SnappitOverlayTarget, snappit_sounds::SnappitSounds,
    snappit_store::SnappitStore,
};

use super::platform_notifications;

const EMIT_RETRY_ATTEMPTS: u32 = 3;
const EMIT_RETRY_DELAY_MS: u64 = 50;
const ANIMATION_DURATION: f64 = 0.2;
const WINDOW_BOTTOM_MARGIN: i32 = 200;

pub(super) const WINDOW_WIDTH: f64 = 320.0;
pub(super) const WINDOW_HEIGHT: f64 = 220.0;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SnappitNotificationPayload {
    pub target: SnappitOverlayTarget,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
}

pub struct SnappitNotifications;

impl SnappitNotifications {
    pub fn is_enabled(app: &AppHandle<Wry>) -> bool {
        match SnappitStore::get_value(app, &SNAPPIT_CONSTS.store.keys.notifications) {
            Ok(Some(value)) => value.as_bool().unwrap_or(true),
            _ => true,
        }
    }

    pub fn notify(app: &AppHandle<Wry>, payload: SnappitNotificationPayload) -> SnappitResult<()> {
        let window_enabled = Self::is_enabled(app);
        let sound_enabled = SnappitSounds::is_enabled(app);

        if window_enabled {
            Self::show(app, payload)?;
        }

        if sound_enabled {
            SnappitSounds::play_capture_unchecked(app);
        }

        Ok(())
    }

    fn show(
        app: &AppHandle<Wry>,
        payload: SnappitNotificationPayload,
    ) -> SnappitResult<WebviewWindow> {
        let window = platform_notifications::ensure_notification_window(app)?;

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

        platform_notifications::prepare_show(app, &window);
        platform_notifications::show_window(app, &window)?;
        platform_notifications::finalize_show(app, &window, ANIMATION_DURATION);

        Self::emit_with_retry(&window, "notification:shown", payload)?;
        log::info!("notification shown");

        Ok(window)
    }

    pub fn animate_out(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let window = platform_notifications::get_notification_window(app)?;

        Self::emit_with_retry(&window, "notification:animate_out", true)?;
        platform_notifications::animate_out_window(app, &window, ANIMATION_DURATION)?;

        Ok(())
    }

    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = platform_notifications::ensure_notification_window(app)?;

        Self::emit_with_retry(&window, "notification:hidden", true)?;
        platform_notifications::hide_window(app, &window)?;
        log::info!("notification hidden");

        Ok(window)
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        platform_notifications::ensure_notification_window(app)
    }

    fn emit_with_retry<S: Serialize + Clone>(
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
}

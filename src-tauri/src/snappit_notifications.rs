use std::cmp;

use serde::{Deserialize, Serialize};
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};

use crate::{
    platform::Platform, snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult,
    snappit_overlay::SnappitOverlayTarget,
};

const WINDOW_WIDTH: u32 = 320;
const WINDOW_HEIGHT: u32 = 220;
const WINDOW_BOTTOM_MARGIN: i32 = 400;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SnappitNotificationPayload {
    pub target: SnappitOverlayTarget,
    pub value: String,
}

pub struct SnappitNotifications;

impl SnappitNotifications {
    pub fn show(
        app: &AppHandle<Wry>,
        payload: SnappitNotificationPayload,
    ) -> SnappitResult<WebviewWindow> {
        let window = Self::ensure_window(app)?;

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
        window.show()?;
        window.emit("notification:shown", payload.clone())?;
        log::info!("shown");

        Ok(window)
    }

    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::ensure_window(app)?;

        window.emit("notification:hidden", true)?;
        log::info!("hidden");
        window.hide()?;

        Ok(window)
    }

    fn ensure_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        if let Some(window) = app.get_webview_window(SNAPPIT_CONSTS.windows.notification.as_str()) {
            Ok(window)
        } else {
            Self::preload(app)
        }
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::builder(app)
            .fullscreen(false)
            .always_on_top(true)
            .content_protected(false)
            .closable(false)
            .decorations(false)
            .transparent(true)
            .resizable(false)
            .shadow(false)
            .inner_size(WINDOW_WIDTH.into(), WINDOW_HEIGHT.into())
            .focusable(false)
            .build()?;

        Ok(window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let builder = WebviewWindow::builder(
            app,
            SNAPPIT_CONSTS.windows.notification.as_str(),
            WebviewUrl::App("apps/notifications/index.html".into()),
        )
        .title("Notification Notifications")
        .visible(false);

        builder
    }
}

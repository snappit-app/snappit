use tauri::{
    webview::Color, AppHandle, Error as TauriError, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};

use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult};

use super::snappit_notifications::{WINDOW_HEIGHT, WINDOW_WIDTH};

pub fn prepare_show(_app: &AppHandle<Wry>, _window: &WebviewWindow) {}

pub fn show_window(_app: &AppHandle<Wry>, window: &WebviewWindow) -> SnappitResult<()> {
    window.show()?;
    Ok(())
}

pub fn finalize_show(_app: &AppHandle<Wry>, _window: &WebviewWindow, _duration: f64) {}

pub fn animate_out_window(
    _app: &AppHandle<Wry>,
    _window: &WebviewWindow,
    _duration: f64,
) -> SnappitResult<()> {
    Ok(())
}

pub fn hide_window(_app: &AppHandle<Wry>, window: &WebviewWindow) -> SnappitResult<()> {
    window.hide()?;
    Ok(())
}

pub fn get_notification_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    app.get_webview_window(SNAPPIT_CONSTS.windows.notification.as_str())
        .ok_or_else(|| TauriError::WebviewNotFound.into())
}

pub fn ensure_notification_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    if let Ok(window) = get_notification_window(app) {
        return Ok(window);
    }

    let window = builder(app)
        .fullscreen(false)
        .accept_first_mouse(true)
        .always_on_top(true)
        .content_protected(false)
        .closable(false)
        .shadow(false)
        .decorations(false)
        .focusable(false)
        .resizable(false)
        .skip_taskbar(true)
        .transparent(true)
        .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
        .build()?;

    Ok(window)
}

fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
    WebviewWindow::builder(
        app,
        SNAPPIT_CONSTS.windows.notification.as_str(),
        WebviewUrl::App("apps/notifications/index.html".into()),
    )
    .title("")
    .visible(false)
}

use tauri::{
    AppHandle, Error as TauriError, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Wry,
};

use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult};

pub fn remember_previous_app(_overlay_was_visible: bool) {}

pub fn prepare_for_resize(_app: &AppHandle<Wry>, _overlay: &WebviewWindow) {}

pub fn show_overlay(_app: &AppHandle<Wry>, overlay: &WebviewWindow) -> SnappitResult<()> {
    overlay.show()?;
    overlay.set_focus()?;
    Ok(())
}

pub fn hide_overlay(_app: &AppHandle<Wry>, overlay: &WebviewWindow) -> SnappitResult<()> {
    overlay.hide()?;
    Ok(())
}

pub fn finalize_after_layout(_app: &AppHandle<Wry>) {}

pub fn get_overlay_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    app.get_webview_window(SNAPPIT_CONSTS.windows.overlay.as_str())
        .ok_or_else(|| TauriError::WebviewNotFound.into())
}

pub fn ensure_overlay_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    if let Ok(window) = get_overlay_window(app) {
        return Ok(window);
    }

    let window = builder(app)
        .fullscreen(false)
        .accept_first_mouse(true)
        .shadow(false)
        .focusable(true)
        .always_on_top(true)
        .content_protected(false)
        .skip_taskbar(true)
        .closable(false)
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .build()?;

    Ok(window)
}

fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
    WebviewWindow::builder(
        app,
        SNAPPIT_CONSTS.windows.overlay.as_str(),
        WebviewUrl::App("apps/snap_overlay/index.html".into()),
    )
    .title(SNAPPIT_CONSTS.windows.overlay.as_str())
    .visible(false)
}

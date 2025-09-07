use crate::text_snap_errors::TextSnapResult;
use crate::{platform::Platform, text_snap_consts::TEXT_SNAP_CONSTS};
#[cfg(target_os = "macos")]
use objc2_app_kit::NSScreenSaverWindowLevel;
use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};
pub struct TextSnapOverlay;

impl TextSnapOverlay {
    pub fn hide(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
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
}

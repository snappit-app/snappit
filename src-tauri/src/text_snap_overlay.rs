use crate::platform::Platform;
use crate::text_snap_errors::TextSnapResult;
#[cfg(target_os = "macos")]
use objc2_app_kit::NSScreenSaverWindowLevel;
use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};
pub struct TextSnapOverlay;

impl TextSnapOverlay {
    pub const ID: &str = "snap_overlay";

    pub fn hide(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let overlay = app
            .get_webview_window(Self::ID)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;

        overlay.hide()?;
        overlay.emit("snap_overlay:hidden", true)?;
        Ok(overlay)
    }

    pub fn show(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        let physical_size = monitor.size().clone();
        let overlay = app
            .get_webview_window(Self::ID)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        #[cfg(target_os = "macos")]
        {
            Platform::set_window_level(overlay.as_ref().window(), NSScreenSaverWindowLevel);
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
            .always_on_top(true)
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
            Self::ID,
            WebviewUrl::App("apps/snap_overlay/index.html".into()),
        )
        .title(Self::ID)
        .visible(false)
        .accept_first_mouse(true);

        builder
    }
}

use crate::text_snap_errors::TextSnapResult;
use objc2_app_kit::NSScreenSaverWindowLevel;
use tauri::{
    AppHandle, Error as TauriError, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Wry,
};

use crate::platform::Platform;
pub struct SnapOverlay;

impl SnapOverlay {
    pub fn show(&self, app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let monitor = Platform::monitor_from_cursor(&app)?;
        let physical_size = monitor.size().clone();
        let overlay = app
            .get_webview_window("snap_overlay")
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        overlay.set_size(physical_size)?;
        overlay.set_position(monitor.position().clone())?;

        #[cfg(target_os = "macos")]
        self.set_window_level(overlay.as_ref().window(), NSScreenSaverWindowLevel);

        overlay.show()?;
        overlay.set_focus()?;

        Ok(overlay)
    }

    pub fn preload(&self, app: &AppHandle<Wry>) -> tauri::Result<WebviewWindow> {
        let window_builder = self
            .window_builder(app)
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

    fn window_builder<'a>(
        &'a self,
        app: &'a AppHandle<Wry>,
    ) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let id = "snap_overlay";

        let builder = WebviewWindow::builder(
            app,
            id,
            WebviewUrl::App("apps/snap_overlay/index.html".into()),
        )
        .title(id)
        .visible(false)
        .accept_first_mouse(true)
        .shadow(true);

        builder
    }

    fn set_window_level(&self, window: tauri::Window, level: objc2_app_kit::NSWindowLevel) {
        let c_window = window.clone();
        _ = window.run_on_main_thread(move || unsafe {
            let ns_win = c_window
                .ns_window()
                .expect("Failed to get native window handle")
                as *const objc2_app_kit::NSWindow;
            (*ns_win).setLevel(level);
        });
    }
}

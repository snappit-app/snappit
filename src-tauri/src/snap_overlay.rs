use std::path::PathBuf;
use tauri::{AppHandle, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Wry};
pub struct SnapOverlay;

pub fn set_window_level(window: tauri::Window, level: objc2_app_kit::NSWindowLevel) {
    let c_window = window.clone();
    _ = window.run_on_main_thread(move || unsafe {
        let ns_win = c_window
            .ns_window()
            .expect("Failed to get native window handle")
            as *const objc2_app_kit::NSWindow;
        (*ns_win).setLevel(level);
    });
}

impl SnapOverlay {
    pub fn preload(&self, app: &AppHandle<Wry>) -> tauri::Result<WebviewWindow> {
        let mut window_builder = self
            .window_builder(app, "snap_overlay.html")
            .fullscreen(false)
            .shadow(false)
            .always_on_top(true)
            .content_protected(true)
            .skip_taskbar(true)
            .closable(true)
            .decorations(false)
            .transparent(true)
            .visible(false);

        if let Some(monitor) = app.primary_monitor()? {
            let size = monitor.size();

            log::info!("Monitor size: {:?}", size);
            window_builder = window_builder.inner_size(size.width.into(), size.height.into());
        }

        let window = window_builder.build()?;

        #[cfg(target_os = "macos")]
        set_window_level(
            window.as_ref().window(),
            objc2_app_kit::NSScreenSaverWindowLevel,
        );

        Ok(window)
    }

    fn window_builder<'a>(
        &'a self,
        app: &'a AppHandle<Wry>,
        url: impl Into<PathBuf>,
    ) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let id = "snap_overlay";

        let builder = WebviewWindow::builder(app, id, WebviewUrl::App(url.into()))
            .title(id)
            .visible(false)
            .accept_first_mouse(true)
            .shadow(true);

        builder
    }
}

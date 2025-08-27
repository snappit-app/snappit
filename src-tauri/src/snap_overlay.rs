use tauri::{
    AppHandle, LogicalPosition, LogicalSize, Manager, Monitor, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, Wry,
};
pub struct SnapOverlay;

impl SnapOverlay {
    pub fn show(&self, app: &AppHandle<Wry>) -> tauri::Result<()> {
        if let Some(monitor) = self.monitor_from_cursor(&app)? {
            let physical_size = monitor.size().clone();

            if let Some(overlay) = app.get_webview_window("snap_overlay") {
                overlay.set_size(physical_size)?;
                overlay.set_position(monitor.position().clone())?;

                #[cfg(target_os = "macos")]
                self.set_window_level(
                    overlay.as_ref().window(),
                    objc2_app_kit::NSScreenSaverWindowLevel,
                );

                overlay.show()?;
            }
        }

        Ok(())
    }

    pub fn preload(&self, app: &AppHandle<Wry>) -> tauri::Result<WebviewWindow> {
        let window_builder = self
            .window_builder(app)
            .fullscreen(false)
            .shadow(false)
            .always_on_top(true)
            .content_protected(true)
            .skip_taskbar(false)
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

        let builder = WebviewWindow::builder(app, id, WebviewUrl::App("snap_overlay.html".into()))
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

    fn monitor_from_cursor(&self, app: &tauri::AppHandle<Wry>) -> tauri::Result<Option<Monitor>> {
        let cursor_pos = app.cursor_position()?;
        let monitors = app.available_monitors()?;

        let monitor = monitors.into_iter().find(|m| {
            let scale = m.scale_factor() as f64;
            let pos: LogicalPosition<f64> = m.position().to_logical(scale);
            let size: LogicalSize<f64> = m.size().to_logical(scale);

            let lx = cursor_pos.x / scale;
            let ly = cursor_pos.y / scale;

            let x_max = pos.x + size.width;
            let y_max = pos.y + size.height;

            lx >= pos.x && lx <= x_max && ly >= pos.y && ly <= y_max
        });

        Ok(monitor)
    }
}

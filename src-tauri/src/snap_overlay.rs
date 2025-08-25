use std::path::PathBuf;
use tauri::{AppHandle, WebviewUrl, WebviewWindow, WebviewWindowBuilder, Wry};

pub struct SnapOverlay;

impl SnapOverlay {
    pub async fn show(&self, app: &AppHandle<Wry>) -> tauri::Result<WebviewWindow> {
        let window_builder = self
            .window_builder(app, "snap_overlay.html")
            .maximized(true)
            .fullscreen(false)
            .shadow(false)
            .always_on_top(true)
            .content_protected(true)
            .skip_taskbar(true)
            .closable(true)
            .decorations(false)
            .transparent(true)
            .visible(true);

        let window = window_builder.build()?;
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

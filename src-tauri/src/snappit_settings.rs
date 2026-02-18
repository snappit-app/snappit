use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, PhysicalPosition, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent, Wry,
};
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

use crate::{
    snappit_consts::SNAPPIT_CONSTS,
    snappit_errors::{SnappitResult, SnappitResultExt},
};

pub struct SnappitSettings;

impl SnappitSettings {
    pub fn get_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = app
            .get_webview_window(SNAPPIT_CONSTS.windows.settings.as_str())
            .ok_or_else(|| TauriError::WebviewNotFound)?;
        return Ok(window);
    }

    pub fn hide(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::get_window(app)?;

        window.emit("settings:hidden", true)?;
        window.hide()?;
        Ok(window)
    }

    pub fn show(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::get_window(app)?;

        window.show()?;

        window.emit("settings:shown", true)?;
        window.set_focus()?;

        Ok(window)
    }

    pub fn show_tab(app: &AppHandle<Wry>, tab: &str) -> SnappitResult<WebviewWindow> {
        let window = Self::get_window(app)?;

        window.show()?;
        window.emit("settings:open_tab", tab)?;
        window.emit("settings:shown", true)?;
        window.set_focus()?;

        Ok(window)
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let mut window = Self::builder(app)
            .fullscreen(false)
            .accept_first_mouse(true)
            .shadow(false)
            .always_on_top(false)
            .content_protected(false)
            .closable(true)
            .maximizable(false)
            .minimizable(false)
            .decorations(false)
            .resizable(false)
            .shadow(true)
            .inner_size(630.0, 600.0);

        #[cfg(target_os = "macos")]
        {
            window = window
                .title_bar_style(tauri::TitleBarStyle::Overlay)
                .transparent(true)
                .decorations(true)
                .traffic_light_position(PhysicalPosition { x: 32, y: 42 });
        }

        let built_window = window.build()?;

        #[cfg(target_os = "macos")]
        {
            apply_vibrancy(&built_window, NSVisualEffectMaterial::Sidebar, None, None)
                .expect("Failed to apply vibrancy");
        }

        let app_clone = app.clone();
        built_window.on_window_event(move |event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                SnappitSettings::hide(&app_clone)
                    .log_on_err_with("Fail to hide settings window on CloseRequested");
            }

            _ => {}
        });

        Ok(built_window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let builder = WebviewWindow::builder(
            app,
            SNAPPIT_CONSTS.windows.settings.as_str(),
            WebviewUrl::App("apps/settings/index.html".into()),
        )
        .title("")
        .visible(false);

        builder
    }
}

use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent, Wry,
};

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

        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;

        window.emit("settings:hidden", true)?;
        window.hide()?;
        Ok(window)
    }

    pub fn show(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::get_window(app)?;

        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Regular)?;

        window.show()?;

        window.emit("settings:shown", true)?;
        window.set_focus()?;

        Ok(window)
    }

    pub fn preload(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        let window = Self::builder(app)
            .fullscreen(false)
            .shadow(false)
            .always_on_top(false)
            .content_protected(false)
            .closable(true)
            .decorations(true)
            .transparent(false)
            .resizable(false)
            .shadow(true)
            .inner_size(550.0, 660.0)
            .build()?;

        let app_clone = app.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                SnappitSettings::hide(&app_clone)
                    .log_on_err_with("Fail to hide setting window on CloseRequested");
            }
        });

        Ok(window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let builder = WebviewWindow::builder(
            app,
            SNAPPIT_CONSTS.windows.settings.as_str(),
            WebviewUrl::App("apps/settings/index.html".into()),
        )
        .title("Snappit Settings")
        .visible(false);

        builder
    }
}

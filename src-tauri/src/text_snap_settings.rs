use tauri::{
    AppHandle, Emitter, Error as TauriError, Manager, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent, Wry,
};

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapSettings;

impl TextSnapSettings {
    pub const ID: &str = "settings";

    pub fn hide(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let window = app
            .get_webview_window(Self::ID)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Accessory)?;

        window.hide()?;
        window.emit("settings:hidden", true)?;
        Ok(window)
    }

    pub fn show(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
        let window = app
            .get_webview_window(Self::ID)
            .ok_or_else(|| TauriError::WebviewNotFound)?;

        #[cfg(target_os = "macos")]
        app.set_activation_policy(tauri::ActivationPolicy::Regular)?;

        window.show()?;
        window.emit("settings:shown", true)?;
        window.set_focus()?;

        Ok(window)
    }

    pub fn preload(app: &AppHandle<Wry>) -> TextSnapResult<WebviewWindow> {
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
            .inner_size(460.0, 500.0)
            .build()?;

        let app_clone = app.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Err(err) = TextSnapSettings::hide(&app_clone) {
                    log::error!("Fail to hide setting window on CloseRequested: {err}");
                }
            }
        });

        Ok(window)
    }

    fn builder<'a>(app: &'a AppHandle<Wry>) -> WebviewWindowBuilder<'a, Wry, AppHandle<Wry>> {
        let builder = WebviewWindow::builder(
            app,
            Self::ID,
            WebviewUrl::App("apps/settings/index.html".into()),
        )
        .title("TextSnap Settings")
        .visible(false)
        .accept_first_mouse(true)
        .shadow(true);

        builder
    }
}

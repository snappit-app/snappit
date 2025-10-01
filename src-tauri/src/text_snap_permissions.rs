use serde::Serialize;
use tauri::{AppHandle, Emitter, Wry};

use crate::{
    text_snap_errors::{TextSnapError, TextSnapResult},
    text_snap_settings::TextSnapSettings,
};

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TextSnapPermissionsState {
    pub screen_recording: bool,
}

impl TextSnapPermissionsState {
    fn new() -> Self {
        Self {
            screen_recording: Self::screen_recording_granted(),
        }
    }

    fn screen_recording_granted() -> bool {
        #[cfg(target_os = "macos")]
        unsafe {
            CGPreflightScreenCaptureAccess()
        }

        #[cfg(not(target_os = "macos"))]
        {
            true
        }
    }

    pub fn all_granted(&self) -> bool {
        self.screen_recording
    }
}

pub struct TextSnapPermissions;

impl TextSnapPermissions {
    pub const EVENT_NAME: &'static str = "permissions:state";

    pub fn current_state() -> TextSnapPermissionsState {
        TextSnapPermissionsState::new()
    }

    pub fn ensure_for_overlay(app: &AppHandle<Wry>) -> TextSnapResult<TextSnapPermissionsState> {
        let state = Self::current_state();

        if state.all_granted() {
            return Ok(state);
        }

        Self::emit_state(app, state)?;
        TextSnapSettings::show(app)?;

        Err(TextSnapError::MissingPermissions(
            "screen recording permission is required",
        ))
    }

    pub fn emit_state(app: &AppHandle<Wry>, state: TextSnapPermissionsState) -> TextSnapResult<()> {
        app.emit(Self::EVENT_NAME, state)?;
        Ok(())
    }

    pub fn refresh_and_emit(app: &AppHandle<Wry>) -> TextSnapResult<TextSnapPermissionsState> {
        let state = Self::current_state();
        Self::emit_state(app, state)?;
        Ok(state)
    }

    pub fn request_screen_recording(
        app: &AppHandle<Wry>,
    ) -> TextSnapResult<TextSnapPermissionsState> {
        #[cfg(target_os = "macos")]
        unsafe {
            _ = CGRequestScreenCaptureAccess();
        }

        let state = Self::refresh_and_emit(app)?;

        if !state.screen_recording {
            TextSnapSettings::show(app)?;
        }

        Ok(state)
    }

    pub fn open_screen_recording_settings(app: &AppHandle<Wry>) -> TextSnapResult<()> {
        #[cfg(target_os = "macos")]
        {
            use tauri_plugin_opener::OpenerExt;

            const SCREEN_RECORDING_PREF_URL: &str =
                "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture";

            if let Err(err) = app
                .opener()
                .open_url(SCREEN_RECORDING_PREF_URL, None::<&str>)
            {
                log::error!("Failed to open screen recording preferences: {err}");
            }
        }

        #[cfg(not(target_os = "macos"))]
        let _ = app;

        Ok(())
    }
}

#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}

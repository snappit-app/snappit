use serde::Serialize;
use tauri::{AppHandle, Emitter, Wry};

use crate::{
    snappit_errors::{SnappitError, SnappitResult},
    snappit_settings::SnappitSettings,
};

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SnappitPermissionsState {
    pub screen_recording: bool,
}

impl SnappitPermissionsState {
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

pub struct SnappitPermissions;

impl SnappitPermissions {
    pub const EVENT_NAME: &'static str = "permissions:state";

    pub fn current_state() -> SnappitPermissionsState {
        SnappitPermissionsState::new()
    }

    pub fn ensure_for_overlay(app: &AppHandle<Wry>) -> SnappitResult<SnappitPermissionsState> {
        let state = Self::current_state();

        if state.all_granted() {
            return Ok(state);
        }

        Self::emit_state(app, state)?;
        SnappitSettings::show(app)?;

        Err(SnappitError::MissingPermissions(
            "screen recording permission is required",
        ))
    }

    pub fn emit_state(app: &AppHandle<Wry>, state: SnappitPermissionsState) -> SnappitResult<()> {
        app.emit(Self::EVENT_NAME, state)?;
        Ok(())
    }

    pub fn refresh_and_emit(app: &AppHandle<Wry>) -> SnappitResult<SnappitPermissionsState> {
        let state = Self::current_state();
        Self::emit_state(app, state)?;
        Ok(state)
    }

    pub fn request_screen_recording(
        app: &AppHandle<Wry>,
    ) -> SnappitResult<SnappitPermissionsState> {
        #[cfg(target_os = "macos")]
        unsafe {
            _ = CGRequestScreenCaptureAccess();
        }

        let state = Self::refresh_and_emit(app)?;

        if !state.screen_recording {
            SnappitSettings::show(app)?;
        }

        Ok(state)
    }

    pub fn open_screen_recording_settings(app: &AppHandle<Wry>) -> SnappitResult<()> {
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

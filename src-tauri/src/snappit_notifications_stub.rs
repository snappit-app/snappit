use serde::{Deserialize, Serialize};
use tauri::{AppHandle, WebviewWindow, Wry};

use crate::snappit_errors::{SnappitError, SnappitResult};
use crate::snappit_overlay::SnappitOverlayTarget;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct SnappitNotificationPayload {
    pub target: SnappitOverlayTarget,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
}

pub struct SnappitNotifications;

impl SnappitNotifications {
    pub fn notify(
        _app: &AppHandle<Wry>,
        _payload: SnappitNotificationPayload,
    ) -> SnappitResult<()> {
        Err(SnappitError::UnsupportedPlatform(
            "notifications are only available on macOS",
        ))
    }

    pub fn hide(_app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        Err(SnappitError::UnsupportedPlatform(
            "notifications are only available on macOS",
        ))
    }

    pub fn animate_out(_app: &AppHandle<Wry>) -> SnappitResult<()> {
        Err(SnappitError::UnsupportedPlatform(
            "notifications are only available on macOS",
        ))
    }

    pub fn preload(_app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        Err(SnappitError::UnsupportedPlatform(
            "notifications are only available on macOS",
        ))
    }
}

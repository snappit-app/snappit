use serde::{Deserialize, Serialize};
use tauri::{AppHandle, WebviewWindow, Wry};

use crate::snappit_errors::{SnappitError, SnappitResult};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SnappitOverlayTarget {
    Capture,
    DigitalRuler,
    ColorDropper,
    QrScanner,
    None,
}

pub struct SnappitOverlay;

impl SnappitOverlay {
    pub fn hide(_app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        Err(SnappitError::UnsupportedPlatform(
            "overlay is only available on macOS",
        ))
    }

    pub fn show(
        _app: &AppHandle<Wry>,
        _target: SnappitOverlayTarget,
    ) -> SnappitResult<WebviewWindow> {
        Err(SnappitError::UnsupportedPlatform(
            "overlay is only available on macOS",
        ))
    }

    pub fn get_current_target() -> Option<SnappitOverlayTarget> {
        None
    }

    pub fn preload(_app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
        Err(SnappitError::UnsupportedPlatform(
            "overlay is only available on macOS",
        ))
    }
}

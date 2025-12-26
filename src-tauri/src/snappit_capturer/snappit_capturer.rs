//! Platform-agnostic screen capture API
//!
//! This module provides the main SnappitCapturer struct which offers a unified API
//! for screen capture functionality. Internally, it delegates to platform-specific
//! implementations:
//! - macOS: Uses CoreGraphics with proper color space conversion (macos_capturer)
//! - Other platforms: Uses xcap library (multiplatform_capturer)

use crate::snappit_consts::SNAPPIT_CONSTS;
use crate::snappit_errors::SnappitResult;
use image::{ImageBuffer, Rgba};
use serde::{Deserialize, Serialize};
use std::fmt;
use tauri::AppHandle;

#[cfg(target_os = "macos")]
use super::macos_capturer;

#[cfg(not(target_os = "macos"))]
use super::multiplatform_capturer;

/// Color information in various formats
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnappitColorInfo {
    pub hex: String,
    pub rgb: (u8, u8, u8),
    pub rgba: (u8, u8, u8, u8),
}

impl fmt::Display for SnappitColorInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.hex)
    }
}

impl SnappitColorInfo {
    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        let hex = format!("#{:02X}{:02X}{:02X}", r, g, b);
        Self {
            hex,
            rgb: (r, g, b),
            rgba: (r, g, b, a),
        }
    }
}

/// Main screen capturer providing platform-agnostic API
///
/// This struct internally chooses the appropriate platform-specific implementation:
/// - On macOS: Uses CoreGraphics with sRGB color space conversion
/// - On other platforms: Uses xcap library
pub struct SnappitCapturer;

impl SnappitCapturer {
    /// Get capture parameters from constants
    fn get_params() -> (u32, u32, u32) {
        let radius = SNAPPIT_CONSTS.defaults.color_dropper.magnify_radius;
        let ratio = SNAPPIT_CONSTS.defaults.color_dropper.magnify_ratio;
        let size = radius * 2 + 1;

        (radius, ratio, size)
    }

    /// Capture the color at the cursor position
    ///
    /// Returns color information including hex, rgb, and rgba values.
    /// On macOS, colors are properly converted from display color space to sRGB.
    pub fn capture_color_at_cursor(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> SnappitResult<SnappitColorInfo> {
        #[cfg(target_os = "macos")]
        {
            let (radius, _, _) = Self::get_params();
            macos_capturer::capture_color(app, x, y, radius)
        }

        #[cfg(not(target_os = "macos"))]
        {
            let params = Self::get_params();
            multiplatform_capturer::capture_color(app, x, y, params)
        }
    }

    /// Capture a magnified view around the cursor position
    ///
    /// Returns an ImageBuffer with the magnified pixel grid.
    /// Each logical pixel is expanded by the magnify_ratio.
    pub fn capture_magnified_view(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> SnappitResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        #[cfg(target_os = "macos")]
        {
            let params = Self::get_params();
            macos_capturer::capture_magnified(app, x, y, params)
        }

        #[cfg(not(target_os = "macos"))]
        {
            let params = Self::get_params();
            multiplatform_capturer::capture_magnified(app, x, y, params)
        }
    }
}

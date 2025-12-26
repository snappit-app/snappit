//! Screen capture module
//!
//! This module provides screen capture functionality with platform-specific implementations:
//! - macOS: Uses CoreGraphics with proper sRGB color space conversion
//! - Other platforms: Uses xcap library for cross-platform capture

#[cfg(target_os = "macos")]
mod macos_capturer;

#[cfg(not(target_os = "macos"))]
mod multiplatform_capturer;

mod snappit_capturer;

pub use snappit_capturer::{SnappitCapturer, SnappitColorInfo};

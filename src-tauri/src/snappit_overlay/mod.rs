//! Overlay module
//!
//! This module provides a platform-agnostic overlay API with platform-specific backends:
//! - macOS: Uses NSPanel via tauri-nspanel
//! - Other platforms: Uses regular Tauri window

#[cfg(target_os = "macos")]
mod macos_overlay;

#[cfg(not(target_os = "macos"))]
mod multiplatform_overlay;

mod snappit_overlay;

pub use snappit_overlay::{SnappitOverlay, SnappitOverlayTarget};

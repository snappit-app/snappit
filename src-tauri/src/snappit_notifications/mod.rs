//! Notification module
//!
//! This module provides a platform-agnostic notifications API with platform-specific backends:
//! - macOS: Uses NSPanel + vibrancy + native alpha animation
//! - Other platforms: Uses regular Tauri window

#[cfg(target_os = "macos")]
mod macos_notifications;
#[cfg(not(target_os = "macos"))]
mod multiplatform_notifications;
mod snappit_notifications;

#[cfg(target_os = "macos")]
use macos_notifications as platform_notifications;
#[cfg(not(target_os = "macos"))]
use multiplatform_notifications as platform_notifications;

pub use snappit_notifications::{SnappitNotificationPayload, SnappitNotifications};

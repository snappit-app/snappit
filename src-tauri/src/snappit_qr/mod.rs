//! QR code scanning module
//!
//! This module provides QR code scanning functionality with platform-specific implementations:
//! - macOS: Uses Vision Framework with rxing fallback
//! - Other platforms: Uses rxing library (ZXing port)

mod rxing_qr;
mod snappit_qr;
#[cfg(target_os = "macos")]
mod vision_qr;

pub use snappit_qr::SnappitQr;

//! QR code scanning module
//!
//! This module provides QR code scanning functionality with platform-specific implementations:
//! - macOS: Will use Vision Framework with rxing fallback (Phase 3)
//! - Other platforms: Uses rxing library (ZXing port)

mod rxing_qr;
mod snappit_qr;

pub use snappit_qr::SnappitQr;

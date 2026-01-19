//! QR code scanning module
//!
//! This module provides QR code scanning functionality with platform-specific implementations:
//! - macOS: Will use Vision Framework with fallback (Phase 3)
//! - Other platforms: Uses rqrr/rxing library (Phase 2: rxing)

mod rqrr_qr;
mod snappit_qr;

pub use snappit_qr::SnappitQr;

//! QR code scanning module
//!
//! This module provides QR code scanning functionality with platform-specific implementations:
//! - macOS: Will use Vision Framework (Phase 3)
//! - Other platforms: Uses rqrr/rxing library

use image::{ImageBuffer, Rgba};

use crate::snappit_errors::SnappitResult;

use super::rqrr_qr::RqrrQr;

/// Main QR scanner providing platform-agnostic API
///
/// This struct internally chooses the appropriate platform-specific implementation:
/// - On macOS: Will use Vision Framework with rqrr/rxing fallback (Phase 3)
/// - On other platforms: Uses rqrr/rxing library
pub struct SnappitQr;

impl SnappitQr {
    /// Scan image for QR codes and return the decoded content
    ///
    /// Returns `Ok(Some(content))` if a QR code was found and decoded,
    /// `Ok(None)` if no QR code was found, or an error if scanning failed.
    pub fn scan(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        // Phase 3: macOS Vision Framework will be added here
        // #[cfg(target_os = "macos")]
        // {
        //     match vision_qr::scan(&image) {
        //         Ok(result) => return Ok(result),
        //         Err(err) => {
        //             log::warn!("Vision QR scan failed, falling back to rqrr: {err}");
        //         }
        //     }
        // }

        // Current: use rqrr on all platforms
        // Phase 2: will be replaced with rxing
        RqrrQr::scan(image)
    }
}

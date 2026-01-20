//! QR code scanning module
//!
//! This module provides QR code scanning functionality with platform-specific implementations:
//! - macOS: Uses Vision Framework with rxing fallback
//! - Other platforms: Uses rxing library (ZXing port)

use image::{ImageBuffer, Rgba};

use crate::snappit_errors::SnappitResult;

use super::rxing_qr::RxingQr;
#[cfg(target_os = "macos")]
use super::vision_qr::VisionQr;

/// Main QR scanner providing platform-agnostic API
///
/// This struct internally chooses the appropriate platform-specific implementation:
/// - On macOS: Uses Vision Framework with rxing fallback
/// - On other platforms: Uses rxing library
pub struct SnappitQr;

impl SnappitQr {
    /// Scan image for QR codes and return the decoded content
    ///
    /// Returns `Ok(Some(content))` if a QR code was found and decoded,
    /// `Ok(None)` if no QR code was found, or an error if scanning failed.
    pub fn scan(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        #[cfg(target_os = "macos")]
        {
            match VisionQr::scan(&image) {
                Ok(Some(result)) => return Ok(Some(result)),
                Ok(None) => {
                    // Vision didn't find QR, try rxing as fallback
                    log::debug!("Vision QR scan found nothing, trying rxing fallback");
                }
                Err(err) => {
                    log::warn!("Vision QR scan failed, falling back to rxing: {err}");
                }
            }
        }

        RxingQr::scan(image)
    }
}

//! QR code scanning using rxing (ZXing port)
//!
//! This module provides QR code scanning using the rxing library,
//! a Rust port of the ZXing barcode library known for handling
//! damaged and stylized QR codes well.

use std::collections::HashSet;

use image::{ImageBuffer, Rgba};
use rxing::{
    common::GlobalHistogramBinarizer, BarcodeFormat, BinaryBitmap, DecodeHints,
    Luma8LuminanceSource, MultiFormatReader, Reader,
};

use crate::snappit_errors::{SnappitError, SnappitResult};

pub struct RxingQr;

impl RxingQr {
    /// Scan image for QR codes using rxing
    pub fn scan(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        let width = image.width() as u32;
        let height = image.height() as u32;

        // Convert RGBA to grayscale (luma8) for rxing
        let luma_data: Vec<u8> = image
            .pixels()
            .map(|p| {
                // Standard grayscale conversion: 0.299*R + 0.587*G + 0.114*B
                ((p[0] as u32 * 299 + p[1] as u32 * 587 + p[2] as u32 * 114) / 1000) as u8
            })
            .collect();

        let source = Luma8LuminanceSource::new(luma_data, width, height);
        let mut bitmap = BinaryBitmap::new(GlobalHistogramBinarizer::new(source));

        let mut hints = DecodeHints::default();
        hints.PossibleFormats = Some(HashSet::from([BarcodeFormat::QR_CODE]));
        hints.TryHarder = Some(true);

        let mut reader = MultiFormatReader::default();

        match reader.decode_with_hints(&mut bitmap, &hints) {
            Ok(result) => {
                let text = result.getText().to_string();
                if text.is_empty() {
                    Ok(None)
                } else {
                    Ok(Some(text))
                }
            }
            Err(rxing::Exceptions::NotFoundException(_)) => Ok(None),
            Err(e) => Err(SnappitError::QrScanFailed(e.to_string())),
        }
    }
}

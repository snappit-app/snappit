//! QR code scanning using macOS Vision Framework
//!
//! This module provides QR code scanning using Apple's Vision Framework
//! with VNDetectBarcodesRequest, which uses ML models optimized for
//! handling stylized and custom QR codes.

use image::{ImageBuffer, Rgba};

use crate::snappit_errors::{SnappitError, SnappitResult};

pub struct VisionQr;

impl VisionQr {
    #[cfg(target_os = "macos")]
    pub fn scan(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        use image::DynamicImage;
        use objc2::rc::{autoreleasepool, Retained};
        use objc2::runtime::AnyObject;
        use objc2::{AnyThread, ClassType};
        use objc2_foundation::{NSArray, NSData, NSDictionary};
        use objc2_vision::{
            VNBarcodeSymbologyQR, VNDetectBarcodesRequest, VNImageOption, VNImageRequestHandler,
            VNRequest,
        };

        let dynamic = DynamicImage::ImageRgba8(image.clone());
        let png_bytes = encode_png(&dynamic)?;

        autoreleasepool(|_| -> SnappitResult<Option<String>> {
            let data = NSData::with_bytes(&png_bytes);
            let options: Retained<NSDictionary<VNImageOption, AnyObject>> = NSDictionary::new();

            let handler = VNImageRequestHandler::initWithData_options(
                VNImageRequestHandler::alloc(),
                &data,
                options.as_ref(),
            );

            let request = unsafe { VNDetectBarcodesRequest::new() };

            // Set symbologies to QR only
            if let Some(qr_symbology) = unsafe { VNBarcodeSymbologyQR } {
                let symbologies = NSArray::from_slice(&[qr_symbology]);
                unsafe { request.setSymbologies(&symbologies) };
            }

            // Cast to VNRequest for the requests array
            let request_ref: &VNRequest = request.as_super().as_super();
            let requests: Retained<NSArray<VNRequest>> = NSArray::from_slice(&[request_ref]);

            handler
                .performRequests_error(&requests)
                .map_err(|err| vision_error(&err))?;

            // Extract results
            let results = unsafe { request.results() };
            let Some(observations) = results else {
                return Ok(None);
            };

            for observation in observations.to_vec() {
                if let Some(payload) = unsafe { observation.payloadStringValue() } {
                    let text = payload.to_string();
                    if !text.is_empty() {
                        return Ok(Some(text));
                    }
                }
            }

            Ok(None)
        })
    }

    #[cfg(not(target_os = "macos"))]
    pub fn scan(_image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        Err(SnappitError::VisionQrUnavailable(
            "Vision QR scanning is only available on macOS".into(),
        ))
    }
}

#[cfg(target_os = "macos")]
fn encode_png(img: &image::DynamicImage) -> SnappitResult<Vec<u8>> {
    use image::ImageFormat;
    use std::io::Cursor;

    let mut buf = Vec::new();
    img.write_to(&mut Cursor::new(&mut buf), ImageFormat::Png)?;
    Ok(buf)
}

#[cfg(target_os = "macos")]
fn vision_error(err: &objc2_foundation::NSError) -> SnappitError {
    let description = err.localizedDescription().to_string();
    let message = if description.is_empty() {
        "Vision barcode request failed".to_string()
    } else {
        description
    };

    SnappitError::VisionQrUnavailable(message)
}

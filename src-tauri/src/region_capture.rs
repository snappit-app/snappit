use crate::text_snap_errors::TextSnapResult;
use serde::Deserialize;
use std::time::Instant;
use tauri::{AppHandle, Wry};
use xcap::image::ImageBuffer;

use crate::platform::Platform;

#[derive(Debug, Deserialize)]
pub struct RegionCaptureParams {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

pub struct RegionCapture;

impl RegionCapture {
    pub fn capture(
        app: &AppHandle<Wry>,
        params: RegionCaptureParams,
    ) -> TextSnapResult<ImageBuffer<xcap::image::Rgba<u8>, Vec<u8>>> {
        let monitor = Platform::xcap_monitor_from_cursor(app)?;
        let _start = Instant::now();
        let image = monitor.capture_region(params.x, params.y, params.width, params.height)?;

        Ok(image)
    }
}

// No longer needed to export a structured result; lib encodes to Base64 PNG

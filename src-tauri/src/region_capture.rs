use crate::snappit_errors::SnappitResult;
use image::{ImageBuffer, Rgba};
use serde::Deserialize;
use tauri::{AppHandle, Wry};
use xcap::Monitor;

use crate::platform::Platform;

fn normalized(filename: String) -> String {
    filename.replace(['|', '\\', ':', '/'], "")
}

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
    ) -> SnappitResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let monitor = Platform::xcap_monitor_from_cursor(app)?;
        let monitor_w = monitor.width()?;
        let monitor_h = monitor.height()?;

        let x = params.x.clamp(0, monitor_w);
        let y = params.y.clamp(0, monitor_h);
        let width = (params.width).clamp(0, monitor_w - x);
        let height = (params.height).clamp(0, monitor_h - y);

        let image = monitor.capture_region(x, y, width, height)?;

        #[cfg(debug_assertions)]
        Self::save_image(&image);

        Ok(image)
    }

    pub fn save_image(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) {
        let monitors = Monitor::all().expect("asd");

        let monitor = monitors
            .into_iter()
            .find(|m| m.is_primary().unwrap_or(false))
            .expect("No primary monitor found");

        image
            .save(format!(
                "./target/monitor-{}-region.png",
                normalized(monitor.name().unwrap())
            ))
            .unwrap();
    }
}

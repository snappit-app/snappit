use crate::text_snap_errors::TextSnapResult;
use serde::Deserialize;
use std::time::Instant;
use tauri::{AppHandle, Wry};

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
    pub fn capture(app: &AppHandle<Wry>, params: RegionCaptureParams) -> TextSnapResult<()> {
        if let Some(monitor) = Platform::xcap_monitor_from_cursor(app)? {
            let start = Instant::now();
            let image = monitor.capture_region(params.x, params.y, params.width, params.height)?;
            println!(
                "Time to record region of size {}x{}: {:?}",
                image.width(),
                image.height(),
                start.elapsed()
            );

            image
                .save(format!(
                    "./target/monitor-{}-region.png",
                    normalized(monitor.name().unwrap())
                ))
                .unwrap();
        }

        Ok(())
    }
}

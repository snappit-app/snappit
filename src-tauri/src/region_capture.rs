use serde::Deserialize;
use std::time::Instant;
use xcap::Monitor;

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
    pub fn capture(&self, params: RegionCaptureParams) -> Result<(), Box<dyn std::error::Error>> {
        let monitors = Monitor::all()?;

        let monitor = monitors
            .into_iter()
            .find(|m| m.is_primary().unwrap_or(false))
            .expect("No primary monitor found");

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

        Ok(())
    }
}

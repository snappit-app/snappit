use crate::region_capture::RegionCapture;
use crate::region_capture::RegionCaptureParams;
use crate::text_snap_errors::TextSnapResult;
use image::ImageBuffer;
use image::Rgba;
use serde::{Deserialize, Serialize};
use std::fmt;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextSnapColorInfo {
    pub hex: String,
    pub rgb: (u8, u8, u8),
    pub rgba: (u8, u8, u8, u8),
}

impl fmt::Display for TextSnapColorInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.hex)
    }
}

impl TextSnapColorInfo {
    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        let hex = format!("#{:02X}{:02X}{:02X}", r, g, b);
        Self {
            hex,
            rgb: (r, g, b),
            rgba: (r, g, b, a),
        }
    }
}

pub struct TextSnapColorDropper;

static MAGNIFIED_SIZE: u32 = 6;
static MAGNIFY_RATIO: u32 = 20;

impl TextSnapColorDropper {
    pub fn capture_color_at_cursor(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> TextSnapResult<TextSnapColorInfo> {
        let image = RegionCapture::capture_around_cursor(
            app,
            RegionCaptureParams {
                x: x,
                y: y,
                width: 1,
                height: 1,
            },
        )?;

        let center_x = (image.width() - 1) / 2;
        let center_y = (image.height() - 1) / 2;

        let pixel = image.get_pixel(center_x, center_y);

        let color = TextSnapColorInfo::from_rgba(pixel[0], pixel[1], pixel[2], pixel[3]);

        Ok(color)
    }

    pub fn capture_magnified_view(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> TextSnapResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let image = RegionCapture::capture_around_cursor(
            app,
            RegionCaptureParams {
                x,
                y,
                width: MAGNIFIED_SIZE,
                height: MAGNIFIED_SIZE,
            },
        )?;

        let magnified_width = image.width() * MAGNIFY_RATIO;
        let magnified_height = image.height() * MAGNIFY_RATIO;

        let mut magnified = ImageBuffer::new(magnified_width, magnified_height);

        for py in 0..image.height() {
            for px in 0..image.width() {
                let pixel = image.get_pixel(px, py);
                // Масштабируем каждый пиксель в квадрат MAGNIFY_RATIO × MAGNIFY_RATIO
                let start_x = px * MAGNIFY_RATIO;
                let start_y = py * MAGNIFY_RATIO;
                for dy in 0..MAGNIFY_RATIO {
                    for dx in 0..MAGNIFY_RATIO {
                        magnified.put_pixel(start_x + dx, start_y + dy, *pixel);
                    }
                }
            }
        }

        Ok(magnified)
    }
}

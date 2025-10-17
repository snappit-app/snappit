use crate::platform::Platform;
use crate::region_capture::RegionCapture;
use crate::region_capture::RegionCaptureParams;
use crate::snappit_consts::SNAPPIT_CONSTS;
use crate::snappit_errors::{SnappitError, SnappitResult};
use image::ImageBuffer;
use image::Rgba;
use serde::{Deserialize, Serialize};
use std::fmt;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnappitColorInfo {
    pub hex: String,
    pub rgb: (u8, u8, u8),
    pub rgba: (u8, u8, u8, u8),
}

impl fmt::Display for SnappitColorInfo {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.hex)
    }
}

impl SnappitColorInfo {
    pub fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        let hex = format!("#{:02X}{:02X}{:02X}", r, g, b);
        Self {
            hex,
            rgb: (r, g, b),
            rgba: (r, g, b, a),
        }
    }
}

pub struct SnappitScreenCapture;

impl SnappitScreenCapture {
    fn get_params() -> (u32, u32, u32) {
        let radius = SNAPPIT_CONSTS.defaults.color_dropper.magnify_radius;
        let ratio = SNAPPIT_CONSTS.defaults.color_dropper.magnify_ratio;
        let size = radius * 2 + 1;

        return (radius, ratio, size);
    }

    fn capture_logical_grid(app: &AppHandle, x: u32, y: u32) -> SnappitResult<Vec<Rgba<u8>>> {
        let (radius, _, size) = Self::get_params();

        let tauri_monitor = Platform::monitor_from_cursor(app)?;
        let mut scale = tauri_monitor.scale_factor();
        if scale < 1.0 {
            scale = 1.0;
        }
        let scale = scale as f64;

        let xcap_monitor = Platform::xcap_monitor_from_cursor(app)?;
        let monitor_width = f64::from(xcap_monitor.width()?);
        let monitor_height = f64::from(xcap_monitor.height()?);

        let mut center_x = (x as f64) * scale;
        let mut center_y = (y as f64) * scale;

        if monitor_width >= 1.0 {
            center_x = center_x.clamp(0.0, monitor_width - 1.0);
        } else {
            center_x = 0.0;
        }

        if monitor_height >= 1.0 {
            center_y = center_y.clamp(0.0, monitor_height - 1.0);
        } else {
            center_y = 0.0;
        }

        let cell_span = scale;
        let half_cell = cell_span * 0.5;

        let logical_start_x = center_x - (radius as f64 * cell_span) - half_cell;
        let logical_start_y = center_y - (radius as f64 * cell_span) - half_cell;

        let mut capture_left = logical_start_x.floor() as i64;
        let mut capture_top = logical_start_y.floor() as i64;

        let max_x = monitor_width.max(1.0).ceil() as i64;
        let max_y = monitor_height.max(1.0).ceil() as i64;

        capture_left = capture_left.clamp(0, max_x.saturating_sub(1));
        capture_top = capture_top.clamp(0, max_y.saturating_sub(1));

        let image = RegionCapture::capture_around_cursor(
            app,
            RegionCaptureParams {
                x: x,
                y: y,
                width: size,
                height: size,
            },
        )?;

        let image_width = image.width() as i32;
        let image_height = image.height() as i32;

        let capture_left_f = capture_left as f64;
        let capture_top_f = capture_top as f64;

        let mut grid = vec![Rgba([0, 0, 0, 0]); (size * size) as usize];

        for gy in 0..size {
            let logical_pixel_start_y = logical_start_y + gy as f64 * cell_span;
            let logical_pixel_end_y = logical_pixel_start_y + cell_span;

            let py_start = ((logical_pixel_start_y - capture_top_f).floor().max(0.0)) as i32;
            let py_end = ((logical_pixel_end_y - capture_top_f)
                .ceil()
                .min(image_height as f64)) as i32;

            for gx in 0..size {
                let logical_pixel_start_x = logical_start_x + gx as f64 * cell_span;
                let logical_pixel_end_x = logical_pixel_start_x + cell_span;

                let px_start = ((logical_pixel_start_x - capture_left_f).floor().max(0.0)) as i32;
                let px_end = ((logical_pixel_end_x - capture_left_f)
                    .ceil()
                    .min(image_width as f64)) as i32;

                let mut acc = [0.0f64; 4];
                let mut weight_sum = 0.0f64;

                for py in py_start..py_end {
                    if py < 0 || py >= image_height {
                        continue;
                    }

                    let pixel_top = capture_top_f + py as f64;
                    let pixel_bottom = pixel_top + 1.0;
                    let overlap_y = (logical_pixel_end_y.min(pixel_bottom)
                        - logical_pixel_start_y.max(pixel_top))
                    .max(0.0);

                    if overlap_y == 0.0 {
                        continue;
                    }

                    for px in px_start..px_end {
                        if px < 0 || px >= image_width {
                            continue;
                        }

                        let pixel_left = capture_left_f + px as f64;
                        let pixel_right = pixel_left + 1.0;
                        let overlap_x = (logical_pixel_end_x.min(pixel_right)
                            - logical_pixel_start_x.max(pixel_left))
                        .max(0.0);

                        if overlap_x == 0.0 {
                            continue;
                        }

                        let weight = overlap_x * overlap_y;
                        let pixel = image.get_pixel(px as u32, py as u32);

                        for channel in 0..4 {
                            acc[channel] += pixel[channel] as f64 * weight;
                        }

                        weight_sum += weight;
                    }
                }

                let idx = (gy * size + gx) as usize;

                if weight_sum > 0.0 {
                    let r = (acc[0] / weight_sum).round().clamp(0.0, 255.0) as u8;
                    let g = (acc[1] / weight_sum).round().clamp(0.0, 255.0) as u8;
                    let b = (acc[2] / weight_sum).round().clamp(0.0, 255.0) as u8;
                    let a = (acc[3] / weight_sum).round().clamp(0.0, 255.0) as u8;
                    grid[idx] = Rgba([r, g, b, a]);
                } else {
                    let fallback_px = px_start.clamp(0, image_width.saturating_sub(1));
                    let fallback_py = py_start.clamp(0, image_height.saturating_sub(1));
                    grid[idx] = *image.get_pixel(fallback_px as u32, fallback_py as u32);
                }
            }
        }

        Ok(grid)
    }

    pub fn capture_color_at_img(
        app: &AppHandle,
        img: ImageBuffer<Rgba<u8>, Vec<u8>>,
    ) -> SnappitResult<SnappitColorInfo> {
        let _ = app;

        let width = img.width();
        let height = img.height();

        if width == 0 || height == 0 {
            return Err(SnappitError::BadRgbaFrameSize);
        }

        let center_x = (width - 1) / 2;
        let center_y = (height - 1) / 2;
        let pixel = *img.get_pixel(center_x, center_y);

        Ok(SnappitColorInfo::from_rgba(
            pixel[0], pixel[1], pixel[2], pixel[3],
        ))
    }

    pub fn capture_color_at_cursor(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> SnappitResult<SnappitColorInfo> {
        let (radius, _, size) = Self::get_params();

        let grid = Self::capture_logical_grid(app, x, y)?;
        let center_index = (radius * size + radius) as usize;
        let pixel = grid[center_index];

        Ok(SnappitColorInfo::from_rgba(
            pixel[0], pixel[1], pixel[2], pixel[3],
        ))
    }

    pub fn capture_magnified_view(
        app: &AppHandle,
        x: u32,
        y: u32,
    ) -> SnappitResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let (_, ratio, size) = Self::get_params();
        let grid = Self::capture_logical_grid(app, x, y)?;

        let magnified_width = size * ratio;
        let magnified_height = size * ratio;
        let mut magnified = ImageBuffer::new(magnified_width, magnified_height);

        for gy in 0..size {
            for gx in 0..size {
                let pixel = grid[(gy * size + gx) as usize];
                let start_x = gx * ratio;
                let start_y = gy * ratio;

                for dy in 0..ratio {
                    for dx in 0..ratio {
                        magnified.put_pixel(start_x + dx, start_y + dy, pixel);
                    }
                }
            }
        }

        Ok(magnified)
    }
}

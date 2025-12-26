//! macOS-specific color capture using CoreGraphics with color space conversion
//!
//! Pipeline:
//! CGWindowListCreateImage (raw screen pixels)
//! -> Convert from display color space to linear RGB
//! -> Averaging (pixel grid)
//! -> Convert linear RGB to sRGB
//! -> HEX

use crate::snappit_errors::{SnappitError, SnappitResult};
use core_foundation::base::{CFRelease, CFTypeRef};
use core_graphics::display::{
    kCGWindowImageBestResolution, kCGWindowImageBoundsIgnoreFraming, CGPoint, CGRect, CGSize,
};
use image::{ImageBuffer, Rgba};
use std::ffi::c_void;

// CGWindowList constants
const K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY: u32 = 1 << 0;
const K_CG_NULL_WINDOW_ID: u32 = 0;

// CoreGraphics functions
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGWindowListCreateImage(
        screenBounds: CGRect,
        listOption: u32,
        windowID: u32,
        imageOption: u32,
    ) -> *const c_void;
    fn CGImageGetWidth(image: *const c_void) -> usize;
    fn CGImageGetHeight(image: *const c_void) -> usize;
    fn CGImageGetBytesPerRow(image: *const c_void) -> usize;
    fn CGImageGetDataProvider(image: *const c_void) -> *const c_void;
    fn CGDataProviderCopyData(provider: *const c_void) -> *const c_void;
    fn CFDataGetLength(data: *const c_void) -> isize;
    fn CFDataGetBytePtr(data: *const c_void) -> *const u8;
    fn CGImageRelease(image: *const c_void);
}

/// Color in linear RGB space (0.0 - 1.0)
#[derive(Clone, Copy, Debug)]
pub struct LinearRgb {
    pub r: f32,
    pub g: f32,
    pub b: f32,
}

/// Color in sRGB space (0-255)
#[derive(Clone, Copy, Debug)]
pub struct SrgbColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl SrgbColor {
    #[allow(dead_code)]
    pub fn to_hex(&self) -> String {
        format!("#{:02X}{:02X}{:02X}", self.r, self.g, self.b)
    }
}

/// Captured pixels in linear RGB format
pub struct CapturedPixels {
    pub pixels: Vec<f32>, // R, G, B values interleaved, in linear space
    pub width: usize,
    pub height: usize,
}

/// Convert sRGB value (0-1) to linear RGB
#[inline]
fn srgb_to_linear(value: f32) -> f32 {
    if value <= 0.04045 {
        value / 12.92
    } else {
        ((value + 0.055) / 1.055).powf(2.4)
    }
}

/// Convert linear RGB value to sRGB (0-1)
#[inline]
fn linear_to_srgb(value: f32) -> f32 {
    if value <= 0.0031308 {
        value * 12.92
    } else {
        1.055 * value.powf(1.0 / 2.4) - 0.055
    }
}

/// Capture a region of the screen and convert to linear RGB
/// Coordinates are in logical points (not physical pixels)
fn capture_region_to_linear(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> SnappitResult<CapturedPixels> {
    unsafe {
        let rect = CGRect::new(&CGPoint::new(x, y), &CGSize::new(width, height));

        // Use kCGWindowListOptionOnScreenOnly to capture all on-screen windows
        // This includes application windows, not just the desktop
        let image = CGWindowListCreateImage(
            rect,
            K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY,
            K_CG_NULL_WINDOW_ID,
            kCGWindowImageBestResolution | kCGWindowImageBoundsIgnoreFraming,
        );

        if image.is_null() {
            return Err(SnappitError::ScreenCaptureKit(
                "Failed to capture screen region".to_string(),
            ));
        }

        let img_width = CGImageGetWidth(image);
        let img_height = CGImageGetHeight(image);
        let bytes_per_row = CGImageGetBytesPerRow(image);

        let data_provider = CGImageGetDataProvider(image);
        if data_provider.is_null() {
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(
                "Failed to get data provider".to_string(),
            ));
        }

        let data = CGDataProviderCopyData(data_provider);
        if data.is_null() {
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(
                "Failed to copy image data".to_string(),
            ));
        }

        let data_ptr = CFDataGetBytePtr(data);
        let data_len = CFDataGetLength(data) as usize;

        if data_ptr.is_null() || data_len == 0 {
            CFRelease(data as CFTypeRef);
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(
                "Empty image data".to_string(),
            ));
        }

        // Convert to linear RGB
        // macOS uses BGRA format
        let mut pixels = Vec::with_capacity(img_width * img_height * 3);

        for row in 0..img_height {
            for col in 0..img_width {
                let offset = row * bytes_per_row + col * 4;
                if offset + 3 <= data_len {
                    // BGRA format
                    let b = *data_ptr.add(offset) as f32 / 255.0;
                    let g = *data_ptr.add(offset + 1) as f32 / 255.0;
                    let r = *data_ptr.add(offset + 2) as f32 / 255.0;

                    // Convert from sRGB to linear RGB
                    pixels.push(srgb_to_linear(r));
                    pixels.push(srgb_to_linear(g));
                    pixels.push(srgb_to_linear(b));
                } else {
                    pixels.push(0.0);
                    pixels.push(0.0);
                    pixels.push(0.0);
                }
            }
        }

        CFRelease(data as CFTypeRef);
        CGImageRelease(image);

        Ok(CapturedPixels {
            pixels,
            width: img_width,
            height: img_height,
        })
    }
}

/// Get linear RGB color at a position
fn get_linear_color_at(captured: &CapturedPixels, x: usize, y: usize) -> LinearRgb {
    if x >= captured.width || y >= captured.height {
        return LinearRgb {
            r: 0.0,
            g: 0.0,
            b: 0.0,
        };
    }

    let idx = (y * captured.width + x) * 3;
    if idx + 2 < captured.pixels.len() {
        LinearRgb {
            r: captured.pixels[idx],
            g: captured.pixels[idx + 1],
            b: captured.pixels[idx + 2],
        }
    } else {
        LinearRgb {
            r: 0.0,
            g: 0.0,
            b: 0.0,
        }
    }
}

/// Convert linear RGB to sRGB color
fn linear_to_srgb_color(linear: LinearRgb) -> SrgbColor {
    let r = (linear_to_srgb(linear.r) * 255.0).round().clamp(0.0, 255.0) as u8;
    let g = (linear_to_srgb(linear.g) * 255.0).round().clamp(0.0, 255.0) as u8;
    let b = (linear_to_srgb(linear.b) * 255.0).round().clamp(0.0, 255.0) as u8;

    SrgbColor { r, g, b }
}

/// Capture color at specified position using native macOS APIs
///
/// Arguments:
/// - x, y: cursor position in logical points relative to the monitor (as provided by the frontend)
/// - grid_radius: radius of the pixel grid for magnifier (in logical pixels)
/// - scale_factor: display scale factor (e.g., 2.0 for Retina)
/// - monitor_origin: the origin (top-left corner) of the monitor in global screen coordinates
///
/// Returns:
/// - center color in sRGB
/// - grid of colors with size (grid_radius * 2 + 1) x (grid_radius * 2 + 1) in LOGICAL pixels
pub fn capture_color_at_position(
    x: u32,
    y: u32,
    grid_radius: u32,
    scale_factor: f64,
    monitor_origin: (f64, f64),
) -> SnappitResult<(SrgbColor, Vec<SrgbColor>)> {
    // Convert local monitor coordinates to global screen coordinates
    // CGWindowListCreateImage expects global coordinates
    let logical_x = x as f64 + monitor_origin.0;
    let logical_y = y as f64 + monitor_origin.1;

    // Grid size in logical pixels
    let grid_size = grid_radius * 2 + 1;

    // Capture region: we need grid_radius logical pixels around the cursor
    // Add small padding for safety
    let padding = grid_radius as f64 + 1.0;

    let capture_x = (logical_x - padding).max(0.0);
    let capture_y = (logical_y - padding).max(0.0);
    let capture_width = padding * 2.0 + 1.0;
    let capture_height = padding * 2.0 + 1.0;

    // Capture returns physical pixels (Retina resolution)
    let captured = capture_region_to_linear(capture_x, capture_y, capture_width, capture_height)?;

    // Calculate the cursor position within the captured image (in physical pixels)
    let offset_x = logical_x - capture_x;
    let offset_y = logical_y - capture_y;
    let center_phys_x = (offset_x * scale_factor).round() as usize;
    let center_phys_y = (offset_y * scale_factor).round() as usize;

    // Get center pixel color
    let center_x = center_phys_x.min(captured.width.saturating_sub(1));
    let center_y = center_phys_y.min(captured.height.saturating_sub(1));
    let center_linear = get_linear_color_at(&captured, center_x, center_y);
    let center_color = linear_to_srgb_color(center_linear);

    // Create pixel grid in LOGICAL pixels
    // Each logical pixel maps to scale_factor physical pixels
    let mut grid = Vec::with_capacity((grid_size * grid_size) as usize);

    for gy in 0..grid_size {
        for gx in 0..grid_size {
            // Offset from center in logical pixels
            let logical_offset_x = gx as isize - grid_radius as isize;
            let logical_offset_y = gy as isize - grid_radius as isize;

            // Convert to physical pixel position
            let phys_x = (center_phys_x as isize
                + (logical_offset_x as f64 * scale_factor).round() as isize)
                .max(0) as usize;
            let phys_y = (center_phys_y as isize
                + (logical_offset_y as f64 * scale_factor).round() as isize)
                .max(0) as usize;

            let linear = get_linear_color_at(&captured, phys_x, phys_y);
            grid.push(linear_to_srgb_color(linear));
        }
    }

    Ok((center_color, grid))
}

/// Convert grid of colors to magnified ImageBuffer
pub fn grid_to_magnified_image(
    grid: &[SrgbColor],
    grid_size: u32,
    magnify_ratio: u32,
) -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let magnified_width = grid_size * magnify_ratio;
    let magnified_height = grid_size * magnify_ratio;
    let mut magnified = ImageBuffer::new(magnified_width, magnified_height);

    for gy in 0..grid_size {
        for gx in 0..grid_size {
            let idx = (gy * grid_size + gx) as usize;
            if idx < grid.len() {
                let color = &grid[idx];
                let pixel = Rgba([color.r, color.g, color.b, 255]);

                let start_x = gx * magnify_ratio;
                let start_y = gy * magnify_ratio;

                for dy in 0..magnify_ratio {
                    for dx in 0..magnify_ratio {
                        magnified.put_pixel(start_x + dx, start_y + dy, pixel);
                    }
                }
            }
        }
    }

    magnified
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_srgb_linear_roundtrip() {
        for i in 0..=255 {
            let srgb = i as f32 / 255.0;
            let linear = srgb_to_linear(srgb);
            let back = linear_to_srgb(linear);
            assert!(
                (srgb - back).abs() < 0.001,
                "Roundtrip failed for {}: {} -> {} -> {}",
                i,
                srgb,
                linear,
                back
            );
        }
    }

    #[test]
    fn test_hex_format() {
        let color = SrgbColor {
            r: 255,
            g: 128,
            b: 0,
        };
        assert_eq!(color.to_hex(), "#FF8000");
    }

    #[test]
    fn test_linear_known_values() {
        // Black stays black
        assert!((srgb_to_linear(0.0) - 0.0).abs() < 0.0001);
        // White stays white
        assert!((srgb_to_linear(1.0) - 1.0).abs() < 0.0001);
        // Mid-gray should be darker in linear
        let mid_gray = srgb_to_linear(0.5);
        assert!(mid_gray < 0.5);
        assert!(mid_gray > 0.2);
    }
}

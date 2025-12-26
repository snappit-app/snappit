//! macOS-specific color capture using CoreGraphics with proper color space conversion
//!
//! Pipeline:
//! CGWindowListCreateImage (screen pixels in display color space)
//! -> Get image's actual color space (Display P3, etc.)
//! -> Convert to sRGB color space using CGColorSpaceCreateWithName
//! -> Extract RGB values
//! -> HEX
//!
//! This ensures consistent colors regardless of display profile.

use crate::platform::Platform;
#[cfg(target_os = "macos")]
use crate::snappit_capturer::SnappitColorInfo;
use crate::snappit_errors::{SnappitError, SnappitResult};
use core_foundation::base::TCFType;
use core_foundation::string::CFString;
use core_graphics::display::{
    kCGWindowImageBestResolution, kCGWindowImageBoundsIgnoreFraming, CGPoint, CGRect, CGSize,
};

use image::{ImageBuffer, Rgba};
use std::ffi::c_void;
#[cfg(target_os = "macos")]
use tauri::AppHandle;

// CGWindowList constants
const K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY: u32 = 1 << 0;
const K_CG_NULL_WINDOW_ID: u32 = 0;

// CGWindowImageOption to exclude cursor from capture
// This flag ensures the cursor is never included in the captured image,
// even when screen recording software (like OBS) changes cursor rendering
const K_CG_WINDOW_IMAGE_SHOULD_BE_OPAQUE: u32 = 1 << 3;

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
    fn CGImageRelease(image: *const c_void);
    fn CGColorSpaceCreateWithName(name: *const c_void) -> *const c_void;
    fn CGColorSpaceRelease(space: *const c_void);
    fn CGBitmapContextCreate(
        data: *mut c_void,
        width: usize,
        height: usize,
        bitsPerComponent: usize,
        bytesPerRow: usize,
        space: *const c_void,
        bitmapInfo: u32,
    ) -> *const c_void;
    fn CGContextDrawImage(context: *const c_void, rect: CGRect, image: *const c_void);
    fn CGContextRelease(context: *const c_void);
}

// CGBitmapInfo flags
const K_CG_IMAGE_ALPHA_PREMULTIPLIED_FIRST: u32 = 2;
const K_CG_BITMAP_BYTE_ORDER_32_LITTLE: u32 = 2 << 12;

// sRGB color space name constant
const K_CG_COLOR_SPACE_SRGB: &str = "kCGColorSpaceSRGB";

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

/// Captured pixels in sRGB format (already converted from display color space)
pub struct CapturedPixels {
    pub pixels: Vec<u8>, // R, G, B, A values interleaved, in sRGB space
    pub width: usize,
    pub height: usize,
    pub bytes_per_row: usize,
}

#[cfg(target_os = "macos")]
pub fn capture_color(
    app: &AppHandle,
    x: u32,
    y: u32,
    radius: u32,
) -> SnappitResult<SnappitColorInfo> {
    let (scale_factor, monitor_origin) = get_monitor_info(app);

    let (center_color, _grid) =
        capture_color_at_position(x, y, radius, scale_factor, monitor_origin)?;

    Ok(SnappitColorInfo::from_rgba(
        center_color.r,
        center_color.g,
        center_color.b,
        255,
    ))
}

pub fn capture_magnified(
    app: &AppHandle,
    x: u32,
    y: u32,
    params: (u32, u32, u32),
) -> SnappitResult<ImageBuffer<Rgba<u8>, Vec<u8>>> {
    let (radius, ratio, size) = params;
    let (scale_factor, monitor_origin) = get_monitor_info(app);

    let (_center_color, grid) =
        capture_color_at_position(x, y, radius, scale_factor, monitor_origin)?;

    let magnified = grid_to_magnified_image(&grid, size, ratio);

    Ok(magnified)
}

#[cfg(target_os = "macos")]
fn get_monitor_info(app: &AppHandle) -> (f64, (f64, f64)) {
    if let Ok(monitor) = Platform::monitor_from_cursor(app) {
        let scale_factor = monitor.scale_factor();
        let position = monitor.position().to_logical::<f64>(scale_factor);
        (scale_factor, (position.x, position.y))
    } else {
        (2.0, (0.0, 0.0))
    }
}

/// Capture a region of the screen and convert to sRGB color space
///
/// This function captures the screen and properly converts colors from the display's
/// native color space (e.g., Display P3, Color LCD) to standard sRGB.
/// This ensures consistent color values regardless of display profile.
///
/// Coordinates are in logical points (not physical pixels)
fn capture_region_to_srgb(
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> SnappitResult<CapturedPixels> {
    unsafe {
        let rect = CGRect::new(&CGPoint::new(x, y), &CGSize::new(width, height));

        // Capture the screen - image is in display's native color space
        // Use kCGWindowImageShouldBeOpaque to exclude cursor from capture
        // This ensures consistent behavior even when screen recording apps change cursor rendering
        let image = CGWindowListCreateImage(
            rect,
            K_CG_WINDOW_LIST_OPTION_ON_SCREEN_ONLY,
            K_CG_NULL_WINDOW_ID,
            kCGWindowImageBestResolution
                | kCGWindowImageBoundsIgnoreFraming
                | K_CG_WINDOW_IMAGE_SHOULD_BE_OPAQUE,
        );

        if image.is_null() {
            return Err(SnappitError::ScreenCaptureKit(
                "Failed to capture screen region".to_string(),
            ));
        }

        // Get image dimensions
        let img_width = CGImageGetWidth(image);
        let img_height = CGImageGetHeight(image);

        if img_width == 0 || img_height == 0 {
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(
                "Captured image has zero dimensions".to_string(),
            ));
        }

        // Create sRGB color space - this is the key to color consistency!
        // By drawing into an sRGB context, CoreGraphics will automatically
        // convert from the display's color space to sRGB.
        let srgb_name = CFString::new(K_CG_COLOR_SPACE_SRGB);
        let srgb_color_space =
            CGColorSpaceCreateWithName(srgb_name.as_concrete_TypeRef() as *const c_void);

        if srgb_color_space.is_null() {
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(
                "Failed to create sRGB color space".to_string(),
            ));
        }

        // Allocate buffer for RGBA pixels in sRGB space
        // Align bytes_per_row to 16 bytes for CoreGraphics requirements
        let bytes_per_pixel = 4;
        let bytes_per_row = ((img_width * bytes_per_pixel + 15) / 16) * 16;
        let mut pixels: Vec<u8> = vec![0; img_height * bytes_per_row];

        // Create bitmap context in sRGB color space
        // When we draw the captured image into this context, CoreGraphics
        // performs color space conversion automatically
        // Use kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little for BGRA format
        // which is the native format on macOS (little-endian) and most compatible
        let bitmap_info = K_CG_IMAGE_ALPHA_PREMULTIPLIED_FIRST | K_CG_BITMAP_BYTE_ORDER_32_LITTLE;
        let context = CGBitmapContextCreate(
            pixels.as_mut_ptr() as *mut c_void,
            img_width,
            img_height,
            8, // bits per component
            bytes_per_row,
            srgb_color_space,
            bitmap_info,
        );

        if context.is_null() {
            CGColorSpaceRelease(srgb_color_space);
            CGImageRelease(image);
            return Err(SnappitError::ScreenCaptureKit(format!(
                "Failed to create bitmap context (width: {}, height: {}, bytes_per_row: {})",
                img_width, img_height, bytes_per_row
            )));
        }

        // Draw the captured image into our sRGB context
        // This is where the color space conversion happens!
        let draw_rect = CGRect::new(
            &CGPoint::new(0.0, 0.0),
            &CGSize::new(img_width as f64, img_height as f64),
        );
        CGContextDrawImage(context, draw_rect, image);

        // Clean up
        CGContextRelease(context);
        CGColorSpaceRelease(srgb_color_space);
        CGImageRelease(image);

        Ok(CapturedPixels {
            pixels,
            width: img_width,
            height: img_height,
            bytes_per_row,
        })
    }
}

/// Get sRGB color at a position in the captured pixels
fn get_srgb_color_at(captured: &CapturedPixels, x: usize, y: usize) -> SrgbColor {
    if x >= captured.width || y >= captured.height {
        return SrgbColor { r: 0, g: 0, b: 0 };
    }

    // Pixels are stored as BGRA (4 bytes per pixel) with row alignment
    // Format: kCGBitmapByteOrder32Little | kCGImageAlphaPremultipliedFirst
    // In memory: B, G, R, A
    let idx = y * captured.bytes_per_row + x * 4;
    if idx + 2 < captured.pixels.len() {
        SrgbColor {
            r: captured.pixels[idx + 2],
            g: captured.pixels[idx + 1],
            b: captured.pixels[idx],
        }
    } else {
        SrgbColor { r: 0, g: 0, b: 0 }
    }
}

/// Capture color at specified position using native macOS APIs
///
/// This function captures colors and converts them from the display's native
/// color space (Display P3, etc.) to standard sRGB for consistent results.
///
/// Arguments:
/// - x, y: cursor position in logical points relative to the monitor (as provided by the frontend)
/// - grid_radius: radius of the pixel grid for magnifier (in logical pixels)
/// - scale_factor: display scale factor (e.g., 2.0 for Retina)
/// - monitor_origin: the origin (top-left corner) of the monitor in global screen coordinates
///
/// Returns:
/// - center color in sRGB (consistent regardless of display profile)
/// - grid of colors with size (grid_radius * 2 + 1) x (grid_radius * 2 + 1) in LOGICAL pixels
fn capture_color_at_position(
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

    // Capture and convert to sRGB color space
    // This is the key change: colors are now properly converted from display
    // color space to sRGB, ensuring consistency across different monitors
    let captured = capture_region_to_srgb(capture_x, capture_y, capture_width, capture_height)?;

    // Calculate the cursor position within the captured image (in physical pixels)
    let offset_x = logical_x - capture_x;
    let offset_y = logical_y - capture_y;
    let center_phys_x = (offset_x * scale_factor).round() as usize;
    let center_phys_y = (offset_y * scale_factor).round() as usize;

    // Get center pixel color (already in sRGB)
    let center_x = center_phys_x.min(captured.width.saturating_sub(1));
    let center_y = center_phys_y.min(captured.height.saturating_sub(1));
    let center_color = get_srgb_color_at(&captured, center_x, center_y);

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

            // Colors are already in sRGB from the capture
            grid.push(get_srgb_color_at(&captured, phys_x, phys_y));
        }
    }

    Ok((center_color, grid))
}

/// Convert grid of colors to magnified ImageBuffer
fn grid_to_magnified_image(
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
    fn test_hex_format() {
        let color = SrgbColor {
            r: 255,
            g: 128,
            b: 0,
        };
        assert_eq!(color.to_hex(), "#FF8000");
    }

    #[test]
    fn test_get_srgb_color_at() {
        // Create a simple 2x2 image with BGRA pixels (macOS native format)
        // Format: B, G, R, A per pixel
        let pixels = vec![
            0, 0, 255, 255, // Red at (0,0): B=0, G=0, R=255, A=255
            0, 255, 0, 255, // Green at (1,0): B=0, G=255, R=0, A=255
            255, 0, 0, 255, // Blue at (0,1): B=255, G=0, R=0, A=255
            0, 255, 255, 255, // Yellow at (1,1): B=0, G=255, R=255, A=255
        ];
        let captured = CapturedPixels {
            pixels,
            width: 2,
            height: 2,
            bytes_per_row: 8, // 2 pixels * 4 bytes
        };

        let red = get_srgb_color_at(&captured, 0, 0);
        assert_eq!(red.r, 255);
        assert_eq!(red.g, 0);
        assert_eq!(red.b, 0);

        let green = get_srgb_color_at(&captured, 1, 0);
        assert_eq!(green.r, 0);
        assert_eq!(green.g, 255);
        assert_eq!(green.b, 0);

        let blue = get_srgb_color_at(&captured, 0, 1);
        assert_eq!(blue.r, 0);
        assert_eq!(blue.g, 0);
        assert_eq!(blue.b, 255);

        let yellow = get_srgb_color_at(&captured, 1, 1);
        assert_eq!(yellow.r, 255);
        assert_eq!(yellow.g, 255);
        assert_eq!(yellow.b, 0);
    }

    #[test]
    fn test_get_srgb_color_at_out_of_bounds() {
        // Single pixel in BGRA format: B=64, G=128, R=255, A=255
        let pixels = vec![64, 128, 255, 255];
        let captured = CapturedPixels {
            pixels,
            width: 1,
            height: 1,
            bytes_per_row: 4, // 1 pixel * 4 bytes
        };

        // Out of bounds should return black
        let oob = get_srgb_color_at(&captured, 10, 10);
        assert_eq!(oob.r, 0);
        assert_eq!(oob.g, 0);
        assert_eq!(oob.b, 0);
    }
}

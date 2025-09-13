use image::{DynamicImage, ImageBuffer, Rgba};

use crate::text_snap_errors::{TextSnapError, TextSnapResult};

pub trait IntoDynamic {
    fn into_dynamic(self) -> TextSnapResult<DynamicImage>;
}

impl IntoDynamic for (u32, u32, Vec<u8>) {
    fn into_dynamic(self) -> TextSnapResult<DynamicImage> {
        let (width, height, bytes) = self;
        let buf = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, bytes)
            .ok_or(TextSnapError::BadRgbaFrameSize)?;
        Ok(DynamicImage::ImageRgba8(buf))
    }
}

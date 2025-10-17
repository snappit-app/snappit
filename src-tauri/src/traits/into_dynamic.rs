use image::{
    codecs::png::PngEncoder, DynamicImage, ExtendedColorType, ImageBuffer, ImageEncoder, Rgba,
};

use crate::snappit_errors::{SnappitError, SnappitResult};

pub trait IntoDynamic {
    fn into_dynamic(self) -> SnappitResult<DynamicImage>;
}

impl IntoDynamic for (u32, u32, Vec<u8>) {
    fn into_dynamic(self) -> SnappitResult<DynamicImage> {
        let (width, height, bytes) = self;
        let buf = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(width, height, bytes)
            .ok_or(SnappitError::BadRgbaFrameSize)?;
        Ok(DynamicImage::ImageRgba8(buf))
    }
}

pub trait IntoPngByes {
    fn into_png_bytes(self) -> SnappitResult<Vec<u8>>;
}

impl IntoPngByes for ImageBuffer<Rgba<u8>, Vec<u8>> {
    fn into_png_bytes(self) -> SnappitResult<Vec<u8>> {
        let width = self.width();
        let height = self.height();

        let mut png_bytes = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut png_bytes);
        let encoder = PngEncoder::new(&mut cursor);
        encoder.write_image(&self.into_raw(), width, height, ExtendedColorType::Rgba8)?;

        return Ok(png_bytes);
    }
}

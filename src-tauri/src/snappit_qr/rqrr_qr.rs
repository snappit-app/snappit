use image::{GrayImage, ImageBuffer, Rgba};
use rqrr::PreparedImage;

use crate::{snappit_errors::SnappitResult, traits::IntoDynamic};

pub struct RqrrQr;

impl RqrrQr {
    fn prepare(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<PreparedImage<GrayImage>> {
        let dynamic = (image.width(), image.height(), image.into_raw()).into_dynamic()?;
        let grayscale = dynamic.to_luma8();
        Ok(PreparedImage::prepare(grayscale))
    }

    pub fn scan(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> SnappitResult<Option<String>> {
        let mut prepared = Self::prepare(image)?;
        let grids = prepared.detect_grids();

        if grids.is_empty() {
            return Ok(None);
        }

        for grid in grids {
            if let Ok((_meta, content)) = grid.decode() {
                if !content.is_empty() {
                    return Ok(Some(content));
                }
            }
        }

        Ok(None)
    }
}

use colored::Colorize;
use image::{GrayImage, ImageBuffer, Rgba};
use rqrr::PreparedImage;

use crate::{text_snap_errors::TextSnapResult, traits::IntoDynamic};

pub struct TextSnapQr;

impl TextSnapQr {
    fn prepare(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> TextSnapResult<PreparedImage<GrayImage>> {
        let dynamic = (image.width(), image.height(), image.into_raw()).into_dynamic()?;
        let grayscale = dynamic.to_luma8();
        Ok(PreparedImage::prepare(grayscale))
    }

    pub fn scan(image: ImageBuffer<Rgba<u8>, Vec<u8>>) -> TextSnapResult<Option<String>> {
        let mut prepared = Self::prepare(image)?;
        let grids = prepared.detect_grids();

        log::info!("{} {:?}", "grid empty".red(), grids.is_empty());
        log::info!("{} {:?}", "grid empty".red(), grids.len());

        if grids.is_empty() {
            return Ok(None);
        }

        for grid in grids {
            log::info!("{} {:?}", "grid empty".red(), grid.decode());
            if let Ok((_meta, content)) = grid.decode() {
                if !content.is_empty() {
                    return Ok(Some(content));
                }
            }
        }

        Ok(None)
    }
}

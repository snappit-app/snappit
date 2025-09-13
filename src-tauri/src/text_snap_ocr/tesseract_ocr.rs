use image::DynamicImage;
use leptess::LepTess;

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapTesseractOcr;

impl TextSnapTesseractOcr {
    pub fn recognize(img: &DynamicImage) -> TextSnapResult<String> {
        let mut lt = LepTess::new(None, "eng").unwrap();
        lt.set_image_from_mem(rgb)?;
        println!("{}", lt.get_utf8_text().unwrap());

        Ok(String::from("text"))
    }
}

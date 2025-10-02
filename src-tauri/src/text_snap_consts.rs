use once_cell::sync::Lazy;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct TextSnapConstants {
    pub store: TextSnapStoreType,
    pub windows: TextSnapWindows,
}
#[derive(Debug, Deserialize)]
pub struct TextSnapStoreType {
    pub file: String,
    pub keys: TextSpanStoreKeys,
    pub color_dropper: TextSpanColorDropperKeys,
}
#[derive(Debug, Deserialize)]
pub struct TextSpanStoreKeys {
    pub theme: String,
    pub hotkey_capture: String,
    pub hotkey_text_capture: String,
    pub hotkey_digital_ruler: String,
    pub hotkey_color_dropper: String,
    pub hotkey_qr_scanner: String,
    pub settings_initialized: String,
}

#[derive(Debug, Deserialize)]
pub struct TextSpanColorDropperKeys {
    pub magnify_ratio: u32,
    pub magnify_radius: u32,
}

#[derive(Debug, Deserialize)]
pub struct TextSnapWindows {
    pub settings: String,
    pub overlay: String,
}

pub static TEXT_SNAP_CONSTS: Lazy<TextSnapConstants> = Lazy::new(|| {
    let raw = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../constants.json"));
    serde_json::from_str::<TextSnapConstants>(raw).expect("Invalid constants.json")
});

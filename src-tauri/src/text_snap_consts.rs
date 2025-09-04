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
}
#[derive(Debug, Deserialize)]
pub struct TextSpanStoreKeys {
    pub theme: String,
    pub hotkey_capture: String,
    pub settings_initialized: String,
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

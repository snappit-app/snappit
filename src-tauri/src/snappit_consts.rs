use std::collections::HashMap;

use once_cell::sync::Lazy;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SnappitConstants {
    pub store: SnappitStoreType,
    pub windows: SnappitWindows,
    pub defaults: SnappitDefaults,
}
#[derive(Debug, Deserialize)]
pub struct SnappitStoreType {
    pub file: String,
    pub keys: SnappitStoreKeys,
}
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct SnappitStoreKeys {
    pub theme: String,
    pub hotkey_capture: String,
    pub hotkey_digital_ruler: String,
    pub hotkey_color_dropper: String,
    pub hotkey_qr_scanner: String,
    pub hotkey_hide: String,
    pub notifications: String,
    pub autostart: String,
    pub recognition_lang: String,
    pub sound_enabled: String,
    pub ocr_keep_line_breaks: String,
    pub qr_auto_open_urls: String,
    pub auto_updates: String,
}

#[derive(Debug, Deserialize)]
pub struct SnappitColorDropperDefaults {
    pub magnify_ratio: u32,
    pub magnify_radius: u32,
}

#[derive(Debug, Deserialize)]
pub struct SnappitDefaults {
    pub shortcuts: HashMap<String, String>,
    pub color_dropper: SnappitColorDropperDefaults,
}

#[derive(Debug, Deserialize)]
pub struct SnappitWindows {
    pub settings: String,
    pub overlay: String,
    pub notification: String,
}

pub static SNAPPIT_CONSTS: Lazy<SnappitConstants> = Lazy::new(|| {
    let raw = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../constants.json"));
    serde_json::from_str::<SnappitConstants>(raw).expect("Invalid constants.json")
});

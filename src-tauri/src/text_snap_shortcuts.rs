use tauri::{AppHandle, Wry};

use crate::text_snap_errors::TextSnapResult;

pub struct TextSnapShortcuts;

impl TextSnapShortcuts {
    pub fn init(app: &AppHandle<Wry>) -> TextSnapResult<()> {
        Ok(())
    }
}

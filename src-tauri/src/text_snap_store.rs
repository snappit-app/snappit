use crate::{text_snap_consts::TEXT_SNAP_CONSTS, text_snap_errors::TextSnapResult};
use tauri_plugin_store::StoreExt;
pub struct TextSnapStore;

impl TextSnapStore {
    pub fn get_value(
        app: &tauri::AppHandle,
        key: &str,
    ) -> TextSnapResult<Option<serde_json::Value>> {
        let store = app.store(TEXT_SNAP_CONSTS.store.file.as_str())?;
        Ok(store.get(key))
    }

    pub fn set_value(
        app: &tauri::AppHandle,
        key: &str,
        value: Option<serde_json::Value>,
    ) -> TextSnapResult<()> {
        let store = app.store(TEXT_SNAP_CONSTS.store.file.as_str())?;
        store.set(key, value);
        store.save()?;
        Ok(())
    }
}

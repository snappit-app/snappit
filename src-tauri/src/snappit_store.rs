use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult};
use tauri_plugin_store::StoreExt;
pub struct SnappitStore;

impl SnappitStore {
    pub fn get_value(
        app: &tauri::AppHandle,
        key: &str,
    ) -> SnappitResult<Option<serde_json::Value>> {
        let store = app.store(SNAPPIT_CONSTS.store.file.as_str())?;
        Ok(store.get(key))
    }

    pub fn set_value(
        app: &tauri::AppHandle,
        key: &str,
        value: Option<serde_json::Value>,
    ) -> SnappitResult<()> {
        let store = app.store(SNAPPIT_CONSTS.store.file.as_str())?;
        store.set(key, value);
        store.save()?;
        Ok(())
    }
}

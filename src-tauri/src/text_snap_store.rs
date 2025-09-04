use crate::{text_snap_consts::TEXT_SNAP_CONSTS, text_snap_errors::TextSnapResult};
use tauri::Listener;
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

    pub fn subscribe_key(app: &tauri::AppHandle, key: &str) -> TextSnapResult<()> {
        let store = app.store(TEXT_SNAP_CONSTS.store.file.as_str())?;

        let key = key.to_string();

        app.listen("plugin:store://change", move |event| {
            let payload = event.payload();
            log::info!("store changed {:?}", payload);
        });

        Ok(())
    }
}

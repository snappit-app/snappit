use std::collections::HashMap;
use std::sync::Mutex;

use once_cell::sync::Lazy;
use serde_json::json;
use tauri::{AppHandle, Wry};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutEvent, ShortcutState};

use crate::{
    snappit_consts::SNAPPIT_CONSTS,
    snappit_errors::{SnappitError, SnappitResult},
    snappit_overlay::{SnappitOverlay, SnappitOverlayTarget},
    snappit_store::SnappitStore,
};

static REGISTERED_SHORTCUTS: Lazy<Mutex<HashMap<SnappitOverlayTarget, String>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub struct SnappitShortcutManager;

impl SnappitShortcutManager {
    const TARGETS: [SnappitOverlayTarget; 5] = [
        SnappitOverlayTarget::SmartTool,
        SnappitOverlayTarget::TextCapture,
        SnappitOverlayTarget::DigitalRuler,
        SnappitOverlayTarget::ColorDropper,
        SnappitOverlayTarget::QrScanner,
    ];

    pub fn sync_all(app: &AppHandle<Wry>) -> SnappitResult<()> {
        for target in Self::TARGETS {
            Self::sync_target(app, target)?;
        }

        Ok(())
    }

    pub fn register_hide(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let key = SNAPPIT_CONSTS.store.keys.hotkey_hide.clone();

        let accelerator = SNAPPIT_CONSTS
            .defaults
            .shortcuts
            .get(key.as_str())
            .ok_or(SnappitError::ConstUndefined)?;

        let app_clone = app.clone();

        tauri::async_runtime::spawn(async move {
            app_clone.global_shortcut().on_shortcut(
                accelerator.as_str(),
                move |app_handle, _shortcut, event: ShortcutEvent| {
                    if event.state == ShortcutState::Released {
                        if let Err(err) = SnappitOverlay::hide(&app_handle) {
                            if !matches!(err, SnappitError::MissingPermissions(_)) {
                                log::error!("Failed to register hide shortcut {:?}", err);
                            }
                        }
                    }
                },
            );
        });

        Ok(())
    }

    pub fn unregister_hide(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let key = SNAPPIT_CONSTS.store.keys.hotkey_hide.clone();

        let accelerator = SNAPPIT_CONSTS
            .defaults
            .shortcuts
            .get(key.as_str())
            .ok_or(SnappitError::ConstUndefined)?;

        let app_clone = app.clone();

        tauri::async_runtime::spawn(async move {
            if app_clone
                .global_shortcut()
                .is_registered(accelerator.as_str())
            {
                app_clone.global_shortcut().unregister(accelerator.as_str());
            }
        });

        Ok(())
    }

    pub fn sync_target(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<Option<String>> {
        if matches!(target, SnappitOverlayTarget::None) {
            return Ok(None);
        }

        let store_key = Self::store_key_for(target);
        let accelerator = Self::resolve_accelerator(app, store_key.as_str())?;

        Self::apply_shortcut(app, target, accelerator.as_deref())?;

        Ok(accelerator)
    }

    fn resolve_accelerator(app: &AppHandle<Wry>, store_key: &str) -> SnappitResult<Option<String>> {
        let stored = SnappitStore::get_value(app, store_key)?
            .and_then(|value| value.as_str().map(|s| s.to_string()));

        if let Some(stored_value) = stored {
            if stored_value.is_empty() {
                return Ok(None);
            }

            return Ok(Some(stored_value));
        }

        if let Some(default) = SNAPPIT_CONSTS
            .defaults
            .shortcuts
            .get(store_key)
            .filter(|value| !value.is_empty())
        {
            SnappitStore::set_value(app, store_key, Some(json!(default)))?;
            return Ok(Some(default.clone()));
        }

        Ok(None)
    }

    fn apply_shortcut(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
        accelerator: Option<&str>,
    ) -> SnappitResult<()> {
        let mut guard = REGISTERED_SHORTCUTS.lock().map_err(|_| {
            SnappitError::IoError(std::io::Error::new(
                std::io::ErrorKind::Other,
                "Shortcut manager state poisoned",
            ))
        })?;

        if let Some(current) = guard.get(&target).cloned() {
            if Some(current.as_str()) == accelerator {
                return Ok(());
            }

            app.global_shortcut().unregister(current.as_str())?;
            guard.remove(&target);
        }

        if let Some(accel) = accelerator {
            let accelerator_string = accel.to_string();
            let target_for_handler = target;

            app.global_shortcut().on_shortcut(
                accelerator_string.as_str(),
                move |app_handle, _shortcut, event: ShortcutEvent| {
                    if event.state == ShortcutState::Pressed {
                        if let Err(err) = SnappitOverlay::show(&app_handle, target_for_handler) {
                            if !matches!(err, SnappitError::MissingPermissions(_)) {
                                log::error!(
                                    "Failed to show overlay for {:?}: {:?}",
                                    target_for_handler,
                                    err
                                );
                            }
                        }
                    }
                },
            )?;

            guard.insert(target, accelerator_string);
        }

        Ok(())
    }

    fn store_key_for(target: SnappitOverlayTarget) -> String {
        match target {
            SnappitOverlayTarget::SmartTool => SNAPPIT_CONSTS.store.keys.hotkey_capture.clone(),
            SnappitOverlayTarget::TextCapture => {
                SNAPPIT_CONSTS.store.keys.hotkey_text_capture.clone()
            }
            SnappitOverlayTarget::DigitalRuler => {
                SNAPPIT_CONSTS.store.keys.hotkey_digital_ruler.clone()
            }
            SnappitOverlayTarget::ColorDropper => {
                SNAPPIT_CONSTS.store.keys.hotkey_color_dropper.clone()
            }
            SnappitOverlayTarget::QrScanner => SNAPPIT_CONSTS.store.keys.hotkey_qr_scanner.clone(),
            SnappitOverlayTarget::None => {
                unreachable!("store key requested for SnappitOverlayTarget::None")
            }
        }
    }
}

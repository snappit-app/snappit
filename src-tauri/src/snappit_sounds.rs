#[cfg(target_os = "macos")]
use objc2_app_kit::NSSound;
#[cfg(target_os = "macos")]
use objc2_foundation::NSString;

use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_store::SnappitStore};

const CAPTURE_SOUND: &str = "Glass";

pub struct SnappitSounds;

impl SnappitSounds {
    pub fn is_enabled(app: &tauri::AppHandle) -> bool {
        match SnappitStore::get_value(app, &SNAPPIT_CONSTS.store.keys.sound_enabled) {
            Ok(Some(value)) => value.as_bool().unwrap_or(true),
            _ => true,
        }
    }

    #[cfg(target_os = "macos")]
    pub fn play_capture(app: &tauri::AppHandle) {
        if !Self::is_enabled(app) {
            return;
        }

        Self::play_capture_unchecked(app);
    }

    #[cfg(not(target_os = "macos"))]
    pub fn play_capture(_app: &tauri::AppHandle) {
        // Sound not supported on this platform
    }

    /// Plays capture sound without checking if sound is enabled
    #[cfg(target_os = "macos")]
    pub fn play_capture_unchecked(_app: &tauri::AppHandle) {
        let name = NSString::from_str(CAPTURE_SOUND);
        if let Some(sound) = unsafe { NSSound::soundNamed(&name) } {
            unsafe { sound.play() };
        }
    }

    #[cfg(not(target_os = "macos"))]
    pub fn play_capture_unchecked(_app: &tauri::AppHandle) {
        // Sound not supported on this platform
    }
}

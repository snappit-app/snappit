use std::sync::OnceLock;
use strum_macros::{AsRefStr, EnumString};
use tauri::menu::MenuItemKind;
use tauri::{
    image::Image,
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Wry,
};

use crate::{
    snappit_consts::SNAPPIT_CONSTS,
    snappit_errors::{SnappitError, SnappitResult},
    snappit_license::{LicenseType, SnappitLicense},
    snappit_overlay::{SnappitOverlay, SnappitOverlayTarget},
    snappit_settings::SnappitSettings,
    snappit_shortcut_manager::SnappitShortcutManager,
    snappit_store::SnappitStore,
};

#[derive(EnumString, AsRefStr, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SnappitTrayItemId {
    #[strum(serialize = "capture")]
    Capture,
    #[strum(serialize = "digital_ruler")]
    DigitalRuler,
    #[strum(serialize = "color_dropper")]
    ColorDropper,
    #[strum(serialize = "qr")]
    Qr,
    #[strum(serialize = "settings")]
    Settings,
    #[strum(serialize = "quit")]
    Quit,
}

#[derive(Clone, Copy, Debug)]
pub enum SnappitTrayItem {
    Item {
        id: SnappitTrayItemId,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> SnappitResult<()>,
        accelerator_store_key: Option<fn() -> String>,
    },
    Separator,
}

impl SnappitTrayItem {
    pub const fn item(
        id: SnappitTrayItemId,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> SnappitResult<()>,
    ) -> Self {
        Self::Item {
            id,
            title,
            enabled,
            accelerator_store_key: None,
            handler,
        }
    }

    pub const fn item_with_accelerator(
        id: SnappitTrayItemId,
        title: &'static str,
        enabled: bool,
        accelerator_store_key: fn() -> String,
        handler: fn(&AppHandle<Wry>) -> SnappitResult<()>,
    ) -> Self {
        Self::Item {
            id,
            title,
            enabled,
            accelerator_store_key: Some(accelerator_store_key),
            handler,
        }
    }

    pub const fn separator() -> Self {
        Self::Separator
    }

    pub fn handler(&self) -> Option<fn(&AppHandle<Wry>) -> SnappitResult<()>> {
        match self {
            SnappitTrayItem::Item { handler, .. } => Some(*handler),
            SnappitTrayItem::Separator => None,
        }
    }

    pub fn matches_id(&self, id: &str) -> bool {
        match self {
            SnappitTrayItem::Item { id: item_id, .. } => item_id.as_ref() == id,
            SnappitTrayItem::Separator => false,
        }
    }
}

fn hotkey_capture_key() -> String {
    SNAPPIT_CONSTS.store.keys.hotkey_capture.clone()
}

fn hotkey_digital_ruler_key() -> String {
    SNAPPIT_CONSTS.store.keys.hotkey_digital_ruler.clone()
}

fn hotkey_color_dropper_key() -> String {
    SNAPPIT_CONSTS.store.keys.hotkey_color_dropper.clone()
}

fn hotkey_qr_scanner_key() -> String {
    SNAPPIT_CONSTS.store.keys.hotkey_qr_scanner.clone()
}

pub const TRAY_ITEMS: &[SnappitTrayItem] = &[
    SnappitTrayItem::item_with_accelerator(
        SnappitTrayItemId::Capture,
        "Capture",
        true,
        hotkey_capture_key,
        |app| match SnappitOverlay::show(app, SnappitOverlayTarget::Capture) {
            Ok(_) => Ok(()),
            Err(SnappitError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    SnappitTrayItem::item_with_accelerator(
        SnappitTrayItemId::DigitalRuler,
        "Digital Ruler",
        true,
        hotkey_digital_ruler_key,
        |app| match SnappitOverlay::show(app, SnappitOverlayTarget::DigitalRuler) {
            Ok(_) => Ok(()),
            Err(SnappitError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    SnappitTrayItem::item_with_accelerator(
        SnappitTrayItemId::ColorDropper,
        "Color Dropper",
        true,
        hotkey_color_dropper_key,
        |app| match SnappitOverlay::show(app, SnappitOverlayTarget::ColorDropper) {
            Ok(_) => Ok(()),
            Err(SnappitError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    SnappitTrayItem::item_with_accelerator(
        SnappitTrayItemId::Qr,
        "Qr Scanner",
        true,
        hotkey_qr_scanner_key,
        |app| match SnappitOverlay::show(app, SnappitOverlayTarget::QrScanner) {
            Ok(_) => Ok(()),
            Err(SnappitError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    SnappitTrayItem::separator(),
    SnappitTrayItem::item(SnappitTrayItemId::Settings, "Settings", true, |app| {
        SnappitSettings::show(app)?;
        Ok(())
    }),
    SnappitTrayItem::separator(),
    SnappitTrayItem::item(SnappitTrayItemId::Quit, "Quit", true, |app| {
        app.exit(0);
        Ok(())
    }),
];

impl<'a> TryFrom<&'a MenuEvent> for &'a SnappitTrayItem {
    type Error = ();

    fn try_from(event: &'a MenuEvent) -> Result<Self, Self::Error> {
        TRAY_ITEMS
            .iter()
            .find(|item| item.matches_id(event.id.as_ref()))
            .ok_or(())
    }
}

pub struct SnappitTray;

static MENU: OnceLock<Menu<Wry>> = OnceLock::new();

impl SnappitTray {
    const TRAY_ID: &str = "main";

    fn update_shortcut(
        app: &AppHandle<Wry>,
        id: SnappitTrayItemId,
        accelerator: Option<&str>,
    ) -> SnappitResult<()> {
        let tray = app.tray_by_id(Self::TRAY_ID).expect("tray not found");

        if let Some(menu) = MENU.get() {
            let items = menu.items()?;
            for (position, kind) in items.into_iter().enumerate() {
                match kind {
                    MenuItemKind::MenuItem(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            if cfg!(target_os = "macos") && accelerator.is_none() {
                                // macOS backend ignores `None` accelerators, so rebuild the menu item without a shortcut
                                let item_id = item.id().clone();
                                let item_text = item.text()?;
                                let item_enabled = item.is_enabled()?;

                                menu.remove(&item)?;

                                let new_item = MenuItem::with_id(
                                    app,
                                    item_id,
                                    item_text,
                                    item_enabled,
                                    Option::<&str>::None,
                                )?;

                                menu.insert(&new_item, position)?;
                            } else {
                                item.set_accelerator(accelerator)?;
                            }

                            break;
                        }
                    }
                    MenuItemKind::Check(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            item.set_accelerator(accelerator)?;
                            break;
                        }
                    }
                    MenuItemKind::Icon(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            item.set_accelerator(accelerator)?;
                            break;
                        }
                    }
                    MenuItemKind::Submenu(_) | MenuItemKind::Predefined(_) => {}
                }
            }

            tray.set_menu(Some(menu.clone()))?;
        }

        Ok(())
    }

    fn resolve_shortcut_target(
        target: SnappitOverlayTarget,
    ) -> Option<(SnappitTrayItemId, fn() -> String)> {
        match target {
            SnappitOverlayTarget::Capture => Some((SnappitTrayItemId::Capture, hotkey_capture_key)),
            SnappitOverlayTarget::DigitalRuler => {
                Some((SnappitTrayItemId::DigitalRuler, hotkey_digital_ruler_key))
            }
            SnappitOverlayTarget::ColorDropper => {
                Some((SnappitTrayItemId::ColorDropper, hotkey_color_dropper_key))
            }
            SnappitOverlayTarget::QrScanner => Some((SnappitTrayItemId::Qr, hotkey_qr_scanner_key)),
            SnappitOverlayTarget::None => None,
        }
    }

    pub fn update_overlay_shortcut(
        app: &AppHandle<Wry>,
        target: SnappitOverlayTarget,
    ) -> SnappitResult<()> {
        if let Some((tray_item_id, _)) = Self::resolve_shortcut_target(target) {
            let accelerator = SnappitShortcutManager::sync_target(app, target)?;

            Self::update_shortcut(app, tray_item_id, accelerator.as_deref())?;
        }

        Ok(())
    }

    pub fn update_license_status(app: &AppHandle<Wry>) -> SnappitResult<()> {
        let Some(menu) = MENU.get() else {
            return Ok(());
        };

        let license_text = match SnappitLicense::get_state() {
            Ok(state) => match state.license_type {
                LicenseType::Pro => "⭐ Pro".to_string(),
                LicenseType::Trial => format!("Trial — {} uses left", state.uses_remaining),
            },
            Err(_) => "Trial".to_string(),
        };

        let items = menu.items()?;
        for kind in items {
            if let MenuItemKind::MenuItem(item) = kind {
                if item.id().as_ref() == "license_status" {
                    item.set_text(&license_text)?;
                    break;
                }
            }
        }

        if let Some(tray) = app.tray_by_id(Self::TRAY_ID) {
            tray.set_menu(Some(menu.clone()))?;
        }

        Ok(())
    }

    pub fn init(app: &AppHandle<Wry>) -> SnappitResult<TrayIcon> {
        let menu = Menu::new(app)?;
        let _ = MENU.set(menu.clone());
        let tray_icon = Image::from_bytes(include_bytes!("../icons/tray-generated/64x64.png"))?;

        // Add license status at the top
        let license_text = match SnappitLicense::get_state() {
            Ok(state) => match state.license_type {
                LicenseType::Pro => "⭐ Pro".to_string(),
                LicenseType::Trial => format!("Trial — {} uses left", state.uses_remaining),
            },
            Err(_) => "Trial".to_string(),
        };

        let license_item = MenuItem::with_id(
            app,
            "license_status",
            &license_text,
            false, // Disabled - just for display
            Option::<&str>::None,
        )?;
        menu.append(&license_item)?;
        menu.append(&PredefinedMenuItem::separator(app)?)?;

        for def in TRAY_ITEMS {
            match def {
                SnappitTrayItem::Item {
                    id,
                    title,
                    enabled,
                    accelerator_store_key,
                    ..
                } => {
                    // Resolve accelerator from store by the provided key path
                    let resolved_accelerator = if let Some(key_fn) = accelerator_store_key {
                        let key = key_fn();
                        SnappitStore::get_value(app, key.as_str())?
                            .and_then(|v| v.as_str().map(|s| s.to_string()))
                            .filter(|value| !value.is_empty())
                    } else {
                        None
                    };

                    let item = MenuItem::with_id(
                        app,
                        id.as_ref(),
                        title,
                        *enabled,
                        resolved_accelerator.as_deref(),
                    )?;
                    menu.append(&item)?;
                }
                SnappitTrayItem::Separator => {
                    menu.append(&PredefinedMenuItem::separator(app)?)?;
                }
            }
        }

        let tray = TrayIconBuilder::with_id(Self::TRAY_ID)
            .menu(&menu)
            .show_menu_on_left_click(true)
            .icon(tray_icon)
            .on_menu_event(|app, event| {
                if let Ok(item) = <&SnappitTrayItem>::try_from(&event) {
                    if let Some(handler) = item.handler() {
                        if let Err(err) = handler(app) {
                            log::error!("Tray item handler error: {err}");
                        }
                    }
                }
            })
            .build(app)?;

        Ok(tray)
    }
}

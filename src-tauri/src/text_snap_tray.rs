use std::sync::OnceLock;
use strum_macros::{AsRefStr, EnumString};
use tauri::menu::MenuItemKind;
use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Wry,
};

use crate::text_snap_overlay::{TextSnapOverlay, TextSnapOverlayTarget};
use crate::{
    text_snap_consts::TEXT_SNAP_CONSTS,
    text_snap_errors::{TextSnapError, TextSnapResult},
    text_snap_settings::TextSnapSettings,
    text_snap_store::TextSnapStore,
};

#[derive(EnumString, AsRefStr, Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TextSnapTrayItemId {
    #[strum(serialize = "capture")]
    Capture,
    #[strum(serialize = "capture_text")]
    CaptureText,
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
pub enum TextSnapTrayItem {
    Item {
        id: TextSnapTrayItemId,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
        accelerator_store_key: Option<fn() -> String>,
    },
    Separator,
}

impl TextSnapTrayItem {
    pub const fn item(
        id: TextSnapTrayItemId,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
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
        id: TextSnapTrayItemId,
        title: &'static str,
        enabled: bool,
        accelerator_store_key: fn() -> String,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
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

    pub fn handler(&self) -> Option<fn(&AppHandle<Wry>) -> TextSnapResult<()>> {
        match self {
            TextSnapTrayItem::Item { handler, .. } => Some(*handler),
            TextSnapTrayItem::Separator => None,
        }
    }

    pub fn matches_id(&self, id: &str) -> bool {
        match self {
            TextSnapTrayItem::Item { id: item_id, .. } => item_id.as_ref() == id,
            TextSnapTrayItem::Separator => false,
        }
    }
}

fn hotkey_capture_key() -> String {
    TEXT_SNAP_CONSTS.store.keys.hotkey_capture.clone()
}

pub const TRAY_ITEMS: &[TextSnapTrayItem] = &[
    TextSnapTrayItem::item_with_accelerator(
        TextSnapTrayItemId::Capture,
        "Capture",
        true,
        hotkey_capture_key,
        |app| match TextSnapOverlay::show(app, TextSnapOverlayTarget::SmartTool) {
            Ok(_) => Ok(()),
            Err(TextSnapError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    TextSnapTrayItem::separator(),
    TextSnapTrayItem::item_with_accelerator(
        TextSnapTrayItemId::CaptureText,
        "Capture Text",
        true,
        hotkey_capture_key,
        |app| match TextSnapOverlay::show(app, TextSnapOverlayTarget::TextCapture) {
            Ok(_) => Ok(()),
            Err(TextSnapError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    TextSnapTrayItem::item_with_accelerator(
        TextSnapTrayItemId::DigitalRuler,
        "Digital Ruler",
        true,
        hotkey_capture_key,
        |app| match TextSnapOverlay::show(app, TextSnapOverlayTarget::DigitalRuler) {
            Ok(_) => Ok(()),
            Err(TextSnapError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    TextSnapTrayItem::item_with_accelerator(
        TextSnapTrayItemId::ColorDropper,
        "Color Dropper",
        true,
        hotkey_capture_key,
        |app| match TextSnapOverlay::show(app, TextSnapOverlayTarget::ColorDropper) {
            Ok(_) => Ok(()),
            Err(TextSnapError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    TextSnapTrayItem::item_with_accelerator(
        TextSnapTrayItemId::Qr,
        "Qr Scanner",
        true,
        hotkey_capture_key,
        |app| match TextSnapOverlay::show(app, TextSnapOverlayTarget::QrScanner) {
            Ok(_) => Ok(()),
            Err(TextSnapError::MissingPermissions(_)) => Ok(()),
            Err(err) => Err(err),
        },
    ),
    TextSnapTrayItem::separator(),
    TextSnapTrayItem::item(TextSnapTrayItemId::Settings, "Settings", true, |app| {
        TextSnapSettings::show(app)?;
        Ok(())
    }),
    TextSnapTrayItem::separator(),
    TextSnapTrayItem::item(TextSnapTrayItemId::Quit, "Quit", true, |app| {
        app.exit(0);
        Ok(())
    }),
];

impl<'a> TryFrom<&'a MenuEvent> for &'a TextSnapTrayItem {
    type Error = ();

    fn try_from(event: &'a MenuEvent) -> Result<Self, Self::Error> {
        TRAY_ITEMS
            .iter()
            .find(|item| item.matches_id(event.id.as_ref()))
            .ok_or(())
    }
}

pub struct TextSnapTray;

static MENU: OnceLock<Menu<Wry>> = OnceLock::new();

impl TextSnapTray {
    const TRAY_ID: &str = "main";

    pub fn update_shortcut(
        app: &AppHandle<Wry>,
        id: TextSnapTrayItemId,
        accelerator: Option<&str>,
    ) -> TextSnapResult<()> {
        let tray = app.tray_by_id(Self::TRAY_ID).expect("tray not found");

        if let Some(menu) = MENU.get() {
            for kind in menu.items()? {
                match kind {
                    MenuItemKind::MenuItem(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            item.set_accelerator(accelerator)?;
                        }
                    }
                    MenuItemKind::Check(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            item.set_accelerator(accelerator)?;
                        }
                    }
                    MenuItemKind::Icon(item) => {
                        if item.id().as_ref() == id.as_ref() {
                            item.set_accelerator(accelerator)?;
                        }
                    }
                    // Other kinds don't have accelerators we can set
                    MenuItemKind::Submenu(_) | MenuItemKind::Predefined(_) => {}
                }
            }

            tray.set_menu(Some(menu.clone()))?;
        }

        Ok(())
    }

    pub fn init(app: &AppHandle<Wry>) -> TextSnapResult<TrayIcon> {
        let menu = Menu::new(app)?;
        let _ = MENU.set(menu.clone());

        for def in TRAY_ITEMS {
            match def {
                TextSnapTrayItem::Item {
                    id,
                    title,
                    enabled,
                    accelerator_store_key,
                    ..
                } => {
                    // Resolve accelerator from store by the provided key path
                    let resolved_accelerator = if let Some(key_fn) = accelerator_store_key {
                        let key = key_fn();
                        TextSnapStore::get_value(app, key.as_str())?
                            .and_then(|v| v.as_str().map(|s| s.to_string()))
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
                TextSnapTrayItem::Separator => {
                    menu.append(&PredefinedMenuItem::separator(app)?)?;
                }
            }
        }

        let tray = TrayIconBuilder::with_id(Self::TRAY_ID)
            .menu(&menu)
            .show_menu_on_left_click(true)
            .icon(app.default_window_icon().unwrap().clone())
            .on_menu_event(|app, event| {
                if let Ok(item) = <&TextSnapTrayItem>::try_from(&event) {
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

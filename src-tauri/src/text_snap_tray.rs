use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Wry,
};

use crate::text_snap_overlay::TextSnapOverlay;
use crate::{text_snap_errors::TextSnapResult, text_snap_settings::TextSnapSettings};

#[derive(Clone, Copy, Debug)]
pub enum TextSnapTrayItem {
    Item {
        id: &'static str,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
        accelerator: Option<&'static str>,
    },
    Separator,
}

impl TextSnapTrayItem {
    pub const fn item(
        id: &'static str,
        title: &'static str,
        enabled: bool,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
    ) -> Self {
        Self::Item {
            id,
            title,
            enabled,
            accelerator: None,
            handler,
        }
    }

    pub const fn item_with_accelerator(
        id: &'static str,
        title: &'static str,
        enabled: bool,
        accelerator: &'static str,
        handler: fn(&AppHandle<Wry>) -> TextSnapResult<()>,
    ) -> Self {
        Self::Item {
            id,
            title,
            enabled,
            accelerator: Some(accelerator),
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
            TextSnapTrayItem::Item { id: item_id, .. } => *item_id == id,
            TextSnapTrayItem::Separator => false,
        }
    }
}

pub const TRAY_ITEMS: &[TextSnapTrayItem] = &[
    TextSnapTrayItem::item_with_accelerator("capture", "Capture", true, "cmd+c", |app| {
        TextSnapOverlay::show(app)?;
        Ok(())
    }),
    TextSnapTrayItem::item("settings", "Settings", true, |app| {
        TextSnapSettings::show(app)?;
        Ok(())
    }),
    TextSnapTrayItem::separator(),
    TextSnapTrayItem::item("quit", "Quit", true, |app| {
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

impl TextSnapTray {
    pub fn init(app: &AppHandle<Wry>) -> TextSnapResult<TrayIcon> {
        let menu = Menu::new(app)?;

        for def in TRAY_ITEMS {
            match def {
                TextSnapTrayItem::Item {
                    id,
                    title,
                    enabled,
                    accelerator,
                    ..
                } => {
                    let item = MenuItem::with_id(app, id, title, *enabled, *accelerator)?;
                    menu.append(&item)?;
                }
                TextSnapTrayItem::Separator => {
                    menu.append(&PredefinedMenuItem::separator(app)?)?;
                }
            }
        }

        let tray = TrayIconBuilder::new()
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

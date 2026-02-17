use tauri::Error as TauriError;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindow, Wry};
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelHandle, PanelLevel, StyleMask,
};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

use crate::{snappit_consts::SNAPPIT_CONSTS, snappit_errors::SnappitResult};

use super::snappit_notifications::{WINDOW_HEIGHT, WINDOW_WIDTH};

tauri_panel! {
    panel!(SnappitNotificationPanel {
        config: {
            can_become_key_window: false,
            is_floating_panel: true
        }
    })
}

pub fn prepare_show(_app: &AppHandle<Wry>, window: &WebviewWindow) {
    set_window_alpha(window, 0.0);
}

pub fn show_window(app: &AppHandle<Wry>, window: &WebviewWindow) -> SnappitResult<()> {
    let panel = get_panel(app)?;
    panel.show();
    window.show()?;

    Ok(())
}

pub fn finalize_show(_app: &AppHandle<Wry>, window: &WebviewWindow, duration: f64) {
    animate_window_alpha(window, 1.0, duration);
}

pub fn animate_out_window(
    _app: &AppHandle<Wry>,
    window: &WebviewWindow,
    duration: f64,
) -> SnappitResult<()> {
    animate_window_alpha(window, 0.0, duration);
    Ok(())
}

pub fn hide_window(app: &AppHandle<Wry>, window: &WebviewWindow) -> SnappitResult<()> {
    let panel = get_panel(app)?;
    panel.hide();
    window.hide()?;

    Ok(())
}

pub fn get_notification_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    app.get_webview_window(SNAPPIT_CONSTS.windows.notification.as_str())
        .ok_or_else(|| TauriError::WebviewNotFound.into())
}

pub fn ensure_notification_window(app: &AppHandle<Wry>) -> SnappitResult<WebviewWindow> {
    let (_, window) = ensure_handles(app)?;
    Ok(window)
}

fn get_panel(app: &AppHandle<Wry>) -> SnappitResult<PanelHandle<Wry>> {
    app.get_webview_panel(SNAPPIT_CONSTS.windows.notification.as_str())
        .map_err(|_| TauriError::WebviewNotFound.into())
}

fn ensure_handles(app: &AppHandle<Wry>) -> SnappitResult<(PanelHandle<Wry>, WebviewWindow)> {
    let label = SNAPPIT_CONSTS.windows.notification.as_str();

    let (panel, is_new) = match app.get_webview_panel(label) {
        Ok(panel) => (panel, false),
        Err(_) => (builder(app).build()?, true),
    };

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| TauriError::WebviewNotFound)?;

    if is_new {
        if let Err(err) = apply_vibrancy(
            &window,
            NSVisualEffectMaterial::HudWindow,
            Some(NSVisualEffectState::Active),
            Some(30.0),
        ) {
            log::warn!("Failed to apply notification vibrancy: {err:?}");
        }
    }

    Ok((panel, window))
}

fn builder<'a>(app: &'a AppHandle<Wry>) -> PanelBuilder<'a, Wry, SnappitNotificationPanel> {
    PanelBuilder::<_, SnappitNotificationPanel>::new(
        app,
        SNAPPIT_CONSTS.windows.notification.as_str(),
    )
    .url(WebviewUrl::App("apps/notifications/index.html".into()))
    .title("")
    .level(PanelLevel::PopUpMenu)
    .floating(true)
    .transparent(true)
    .opaque(false)
    .has_shadow(false)
    .collection_behavior(
        CollectionBehavior::new()
            .move_to_active_space()
            .full_screen_auxiliary()
            .ignores_cycle(),
    )
    .style_mask(StyleMask::empty().borderless().nonactivating_panel())
    .no_activate(true)
    .with_window(|window| {
        window
            .visible(false)
            .fullscreen(false)
            .always_on_top(true)
            .content_protected(false)
            .closable(false)
            .decorations(false)
            .transparent(true)
            .resizable(false)
            .shadow(false)
            .focusable(false)
            .skip_taskbar(true)
            .inner_size(WINDOW_WIDTH, WINDOW_HEIGHT)
    })
}

fn set_window_alpha(window: &WebviewWindow, alpha: f64) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            let ns_window = ns_window as *mut AnyObject;
            let _: () = msg_send![ns_window, setAlphaValue: alpha];
        }
    }
}

fn animate_window_alpha(window: &WebviewWindow, alpha: f64, duration: f64) {
    use objc2::msg_send;
    use objc2::runtime::AnyObject;

    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            let ns_window = ns_window as *mut AnyObject;

            let _: () = msg_send![objc2::class!(NSAnimationContext), beginGrouping];

            let animation_context: *mut AnyObject =
                msg_send![objc2::class!(NSAnimationContext), currentContext];
            let _: () = msg_send![animation_context, setDuration: duration];

            let animator: *mut AnyObject = msg_send![ns_window, animator];
            let _: () = msg_send![animator, setAlphaValue: alpha];

            let _: () = msg_send![objc2::class!(NSAnimationContext), endGrouping];
        }
    }
}

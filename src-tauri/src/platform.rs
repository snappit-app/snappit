use crate::snappit_errors::{SnappitError, SnappitResult};
use tauri::{LogicalPosition, LogicalSize, Monitor, Wry};
use xcap::Monitor as XCapMonitor;

pub struct Platform;

impl Platform {
    pub fn monitor_from_cursor(app: &tauri::AppHandle<Wry>) -> SnappitResult<Monitor> {
        let cursor_pos = app.cursor_position()?;
        let primary = app.primary_monitor()?;

        #[cfg(target_os = "macos")]
        let primary_scale = primary.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);
        #[cfg(target_os = "macos")]
        let cursor_logical: LogicalPosition<f64> = cursor_pos.to_logical(primary_scale);

        #[cfg(not(target_os = "macos"))]
        if let Some(monitor) = app.monitor_from_point(cursor_pos.x, cursor_pos.y)? {
            return Ok(monitor);
        }

        #[cfg(target_os = "macos")]
        if let Some(monitor) = app.monitor_from_point(cursor_logical.x, cursor_logical.y)? {
            return Ok(monitor);
        }

        let monitors = app.available_monitors()?;
        #[cfg(target_os = "macos")]
        if let Some(monitor) = monitors.iter().find(|m| {
            let scale = m.scale_factor();
            let pos: LogicalPosition<f64> = m.position().to_logical(scale);
            let size: LogicalSize<f64> = m.size().to_logical(scale);

            let x_max = pos.x + size.width;
            let y_max = pos.y + size.height;

            cursor_logical.x >= pos.x
                && cursor_logical.x < x_max
                && cursor_logical.y >= pos.y
                && cursor_logical.y < y_max
        }) {
            return Ok(monitor.clone());
        }

        if let Some(primary) = primary {
            log::warn!(
                "Monitor under cursor not found. Falling back to primary monitor at ({}, {}).",
                primary.position().x,
                primary.position().y
            );
            return Ok(primary);
        }

        if let Some(first) = monitors.into_iter().next() {
            log::warn!(
                "Monitor under cursor and primary monitor not found. Falling back to first available monitor at ({}, {}).",
                first.position().x,
                first.position().y
            );
            return Ok(first);
        }

        Err(SnappitError::MonitorNotFound)
    }

    pub fn xcap_monitor_from_cursor(app: &tauri::AppHandle<Wry>) -> SnappitResult<XCapMonitor> {
        let cursor_pos = app.cursor_position()?;
        let mut monitors = XCapMonitor::all()?;
        let primary = app.primary_monitor()?;

        #[cfg(target_os = "macos")]
        let primary_scale = primary.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);
        #[cfg(target_os = "macos")]
        let cursor_logical: LogicalPosition<f64> = cursor_pos.to_logical(primary_scale);

        if let Some(index) = monitors.iter().position(|m| {
            let width = match m.width() {
                Ok(s) => s as f64,
                Err(_) => return false,
            };
            let height = match m.height() {
                Ok(s) => s as f64,
                Err(_) => return false,
            };
            let x = match m.x() {
                Ok(s) => s as f64,
                Err(_) => return false,
            };
            let y = match m.y() {
                Ok(s) => s as f64,
                Err(_) => return false,
            };

            let x_max = x + width;
            let y_max = y + height;

            #[cfg(target_os = "macos")]
            {
                cursor_logical.x >= x
                    && cursor_logical.x < x_max
                    && cursor_logical.y >= y
                    && cursor_logical.y < y_max
            }
            #[cfg(not(target_os = "macos"))]
            {
                cursor_pos.x >= x
                    && cursor_pos.x < x_max
                    && cursor_pos.y >= y
                    && cursor_pos.y < y_max
            }
        }) {
            return Ok(monitors.swap_remove(index));
        }

        if let Some(index) = monitors
            .iter()
            .position(|m| m.is_primary().unwrap_or(false))
        {
            log::warn!("XCap monitor under cursor not found. Falling back to primary monitor.");
            return Ok(monitors.swap_remove(index));
        }

        if let Some(first) = monitors.into_iter().next() {
            log::warn!("XCap monitor under cursor not found. Falling back to first monitor.");
            return Ok(first);
        }

        Err(SnappitError::MonitorNotFound)
    }
}

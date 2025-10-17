use crate::snappit_errors::{SnappitError, SnappitResult};
use tauri::{LogicalPosition, LogicalSize, Monitor, Wry};
use xcap::Monitor as XCapMonitor;

pub struct Platform;

impl Platform {
    pub fn monitor_from_cursor(app: &tauri::AppHandle<Wry>) -> SnappitResult<Monitor> {
        let cursor_pos = app.cursor_position()?;
        let monitors = app.available_monitors()?;

        let monitor = monitors
            .into_iter()
            .find(|m| {
                let scale = m.scale_factor() as f64;
                let pos: LogicalPosition<f64> = m.position().to_logical(scale);
                let size: LogicalSize<f64> = m.size().to_logical(scale);

                let lx = cursor_pos.x / scale;
                let ly = cursor_pos.y / scale;

                let x_max = pos.x + size.width;
                let y_max = pos.y + size.height;

                lx >= pos.x && lx <= x_max && ly >= pos.y && ly <= y_max
            })
            .ok_or(SnappitError::MonitorNotFound)?;

        Ok(monitor)
    }

    pub fn xcap_monitor_from_cursor(app: &tauri::AppHandle<Wry>) -> SnappitResult<XCapMonitor> {
        let cursor_pos: tauri::PhysicalPosition<f64> = app.cursor_position()?;
        let monitors = XCapMonitor::all()?;

        let monitor = monitors
            .into_iter()
            .find_map(|m| {
                let scale = match m.scale_factor() {
                    Ok(s) => s as f64,
                    Err(_) => return None,
                };
                let width = match m.width() {
                    Ok(s) => s as f64,
                    Err(_) => return None,
                };
                let height = match m.height() {
                    Ok(s) => s as f64,
                    Err(_) => return None,
                };
                let x = match m.x() {
                    Ok(s) => s as f64,
                    Err(_) => return None,
                };
                let y = match m.y() {
                    Ok(s) => s as f64,
                    Err(_) => return None,
                };

                let lx = cursor_pos.x / scale;
                let ly = cursor_pos.y / scale;

                let x_max = x + width;
                let y_max = y + height;

                if lx >= x && lx <= x_max && ly >= y && ly <= y_max {
                    Some(m)
                } else {
                    None
                }
            })
            .ok_or(SnappitError::MonitorNotFound)?;

        Ok(monitor)
    }
}

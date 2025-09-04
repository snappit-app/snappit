use tauri::Error as TauriError;
use tauri_plugin_store::Error as StoreError;
use thiserror::Error;
use xcap::XCapError;

#[derive(Error, Debug)]
pub enum TextSnapError {
    #[error("TauriError error: {0}")]
    Tauri(#[from] TauriError),

    #[error("XCapError error: {0}")]
    XCap(#[from] XCapError),

    #[error("Store error: {0}")]
    Store(#[from] StoreError),

    #[error("Monitor not found under cursor")]
    MonitorNotFound,
}

pub type TextSnapResult<T> = Result<T, TextSnapError>;

impl From<TextSnapError> for TauriError {
    fn from(err: TextSnapError) -> Self {
        match err {
            TextSnapError::Tauri(e) => e,
            TextSnapError::XCap(e) => TauriError::Anyhow(e.into()),
            TextSnapError::Store(e) => TauriError::Anyhow(e.into()),
            TextSnapError::MonitorNotFound => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Monitor not found").into(),
            ),
        }
    }
}

impl From<TextSnapError> for XCapError {
    fn from(err: TextSnapError) -> Self {
        match err {
            TextSnapError::XCap(e) => e,
            TextSnapError::Tauri(e) => XCapError::Error(e.to_string()),
            TextSnapError::Store(e) => XCapError::Error(e.to_string()),
            TextSnapError::MonitorNotFound => XCapError::new("Monitor not found under cursor"),
        }
    }
}

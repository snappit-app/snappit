use tauri::Error as TauriError;
use thiserror::Error;
use xcap::XCapError;

#[derive(Error, Debug)]
pub enum TextSnapError {
    #[error("TauriError error: {0}")]
    Tauri(#[from] TauriError),

    #[error("XCapError error: {0}")]
    XCap(#[from] XCapError),
}

pub type TextSnapResult<T> = Result<T, TextSnapError>;

impl From<TextSnapError> for TauriError {
    fn from(err: TextSnapError) -> Self {
        match err {
            TextSnapError::Tauri(e) => e,
            TextSnapError::XCap(e) => TauriError::Anyhow(e.into()),
        }
    }
}

impl From<TextSnapError> for XCapError {
    fn from(err: TextSnapError) -> Self {
        match err {
            TextSnapError::XCap(e) => e,
            TextSnapError::Tauri(e) => XCapError::Error(e.to_string()),
        }
    }
}

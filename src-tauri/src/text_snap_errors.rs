use std::str::Utf8Error;

use leptess::{leptonica::PixError, tesseract::TessInitError};
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

    #[error("PixError error: {0}")]
    PixError(#[from] PixError),

    #[error("TessInitError error: {0}")]
    TessInitError(#[from] TessInitError),

    #[error("Utf8Error error: {0}")]
    Utf8Error(#[from] Utf8Error),

    #[error("Monitor not found under cursor")]
    MonitorNotFound,

    #[error("Bad RGBA frame size")]
    BadRgbaFrameSize,

    #[error("Model DIR not found")]
    ModelDirNotFound,

    #[error("Missing models: need det, cls, rec .onnx files")]
    PaddleModelNotFound,
}

pub type TextSnapResult<T> = Result<T, TextSnapError>;

impl From<TextSnapError> for TauriError {
    fn from(err: TextSnapError) -> Self {
        match err {
            TextSnapError::Tauri(e) => e,
            TextSnapError::XCap(e) => TauriError::Anyhow(e.into()),
            TextSnapError::Store(e) => TauriError::Anyhow(e.into()),
            TextSnapError::PixError(e) => TauriError::Anyhow(e.into()),
            TextSnapError::TessInitError(e) => TauriError::Anyhow(e.into()),
            TextSnapError::Utf8Error(e) => TauriError::Anyhow(e.into()),
            TextSnapError::MonitorNotFound => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Monitor not found").into(),
            ),
            TextSnapError::BadRgbaFrameSize => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::InvalidData, "Bad RGBA frame size").into(),
            ),
            TextSnapError::ModelDirNotFound => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Model DIR not found").into(),
            ),
            TextSnapError::PaddleModelNotFound => TauriError::Anyhow(
                std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Missing models: need det, cls, rec .onnx files",
                )
                .into(),
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
            TextSnapError::PixError(e) => XCapError::Error(e.to_string()),
            TextSnapError::TessInitError(e) => XCapError::Error(e.to_string()),
            TextSnapError::Utf8Error(e) => XCapError::Error(e.to_string()),
            TextSnapError::MonitorNotFound => XCapError::new("Monitor not found under cursor"),
            TextSnapError::BadRgbaFrameSize => XCapError::new("Bad RGBA frame size"),
            TextSnapError::ModelDirNotFound => XCapError::new("Model DIR not found"),
            TextSnapError::PaddleModelNotFound => {
                XCapError::new("Missing models: need det, cls, rec .onnx files")
            }
        }
    }
}

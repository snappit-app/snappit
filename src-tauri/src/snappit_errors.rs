use std::{io, str::Utf8Error};

use image::ImageError;
use leptess::{leptonica::PixError, tesseract::TessInitError};
use tauri::Error as TauriError;
use tauri_plugin_store::Error as StoreError;
use thiserror::Error;
use xcap::XCapError;

#[derive(Error, Debug)]
pub enum SnappitError {
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

    #[error("ImageError error: {0}")]
    ImageError(#[from] ImageError),

    #[error("IO error: {0}")]
    IoError(#[from] io::Error),

    #[error("Monitor not found under cursor")]
    MonitorNotFound,

    #[error("Bad RGBA frame size")]
    BadRgbaFrameSize,

    #[error("Model DIR not found")]
    ModelDirNotFound,

    #[error("Missing models: need det, cls, rec .onnx files")]
    PaddleModelNotFound,

    #[error("Missing permissions: {0}")]
    MissingPermissions(&'static str),
}

pub type SnappitResult<T> = Result<T, SnappitError>;

impl From<SnappitError> for TauriError {
    fn from(err: SnappitError) -> Self {
        match err {
            SnappitError::Tauri(e) => e,
            SnappitError::XCap(e) => TauriError::Anyhow(e.into()),
            SnappitError::Store(e) => TauriError::Anyhow(e.into()),
            SnappitError::PixError(e) => TauriError::Anyhow(e.into()),
            SnappitError::TessInitError(e) => TauriError::Anyhow(e.into()),
            SnappitError::Utf8Error(e) => TauriError::Anyhow(e.into()),
            SnappitError::ImageError(e) => TauriError::Anyhow(e.into()),
            SnappitError::IoError(e) => TauriError::Anyhow(e.into()),
            SnappitError::MonitorNotFound => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Monitor not found").into(),
            ),
            SnappitError::BadRgbaFrameSize => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::InvalidData, "Bad RGBA frame size").into(),
            ),
            SnappitError::ModelDirNotFound => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::NotFound, "Model DIR not found").into(),
            ),
            SnappitError::PaddleModelNotFound => TauriError::Anyhow(
                std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Missing models: need det, cls, rec .onnx files",
                )
                .into(),
            ),
            SnappitError::MissingPermissions(msg) => TauriError::Anyhow(
                std::io::Error::new(std::io::ErrorKind::PermissionDenied, msg).into(),
            ),
        }
    }
}

impl From<SnappitError> for XCapError {
    fn from(err: SnappitError) -> Self {
        match err {
            SnappitError::XCap(e) => e,
            SnappitError::Tauri(e) => XCapError::Error(e.to_string()),
            SnappitError::Store(e) => XCapError::Error(e.to_string()),
            SnappitError::PixError(e) => XCapError::Error(e.to_string()),
            SnappitError::TessInitError(e) => XCapError::Error(e.to_string()),
            SnappitError::Utf8Error(e) => XCapError::Error(e.to_string()),
            SnappitError::ImageError(e) => XCapError::Error(e.to_string()),
            SnappitError::IoError(e) => XCapError::Error(e.to_string()),
            SnappitError::MonitorNotFound => XCapError::new("Monitor not found under cursor"),
            SnappitError::BadRgbaFrameSize => XCapError::new("Bad RGBA frame size"),
            SnappitError::ModelDirNotFound => XCapError::new("Model DIR not found"),
            SnappitError::PaddleModelNotFound => {
                XCapError::new("Missing models: need det, cls, rec .onnx files")
            }
            SnappitError::MissingPermissions(msg) => XCapError::Error(msg.to_string()),
        }
    }
}

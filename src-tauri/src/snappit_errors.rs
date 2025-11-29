use std::{io, str::Utf8Error};

use image::ImageError;
use leptess::{leptonica::PixError, tesseract::TessInitError};
use tauri::Error as TauriError;
use tauri_plugin_global_shortcut::Error as ShortcutError;
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

    #[error("Shortcut error: {0}")]
    Shortcut(#[from] ShortcutError),

    #[error("Monitor not found under cursor")]
    MonitorNotFound,

    #[error("Const undefined")]
    ConstUndefined,

    #[error("Bad RGBA frame size")]
    BadRgbaFrameSize,

    #[error("Model DIR not found")]
    ModelDirNotFound,

    #[error("Missing models: need det, cls, rec .onnx files")]
    PaddleModelNotFound,

    #[error("Missing permissions: {0}")]
    MissingPermissions(&'static str),

    #[error("Missing permissions")]
    Other,

    #[error("Reqwest error: {0}")]
    Reqwest(#[from] reqwest::Error),
}

pub type SnappitResult<T> = Result<T, SnappitError>;

impl SnappitError {
    fn skip_default_logging(&self) -> bool {
        matches!(self, SnappitError::MissingPermissions(_))
    }
}

pub trait SnappitResultExt<T> {
    fn log_on_err(self);

    fn log_on_err_with(self, context: &str);

    fn log_on_err_with_filter<F>(self, context: &str, filter: F)
    where
        F: FnOnce(&SnappitError) -> bool;
}

impl<T> SnappitResultExt<T> for SnappitResult<T> {
    fn log_on_err(self) {
        self.log_on_err_with("Snappit error");
    }

    fn log_on_err_with(self, context: &str) {
        self.log_on_err_with_filter(context, SnappitError::skip_default_logging);
    }

    fn log_on_err_with_filter<F>(self, context: &str, filter: F)
    where
        F: FnOnce(&SnappitError) -> bool,
    {
        if let Err(err) = self {
            if filter(&err) {
                return;
            }

            if matches!(err, SnappitError::MissingPermissions(_)) {
                log::warn!("{context}: {err}");
            } else {
                log::error!("{context}: {err}");
            }
        }
    }
}

impl From<SnappitError> for TauriError {
    fn from(err: SnappitError) -> Self {
        match err {
            SnappitError::Tauri(e) => e,
            other => TauriError::Anyhow(other.into()),
        }
    }
}

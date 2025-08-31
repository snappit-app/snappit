use once_cell::sync::Lazy;
use std::sync::Mutex;
use tauri::http::{Request, Response};

#[derive(Clone, Debug)]
pub struct ImageSlot {
    pub bytes: Vec<u8>,
    pub width: u32,
    pub height: u32,
}

pub static IMAGE: Lazy<Mutex<Option<ImageSlot>>> = Lazy::new(|| Mutex::new(None));

pub fn handle_img_request(req: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let guard = IMAGE.lock().unwrap();
    let origin = req
        .headers()
        .get("Origin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("*");

    if let Some(img) = &*guard {
        return Response::builder()
            .header("Cache-Control", "no-store")
            .header("Content-Type", "application/octet-stream")
            .header("Access-Control-Allow-Origin", origin)
            .header("Access-Control-Allow-Methods", "GET, OPTIONS")
            .header("Access-Control-Allow-Headers", "*")
            .header("Access-Control-Allow-Credentials", "true")
            .status(200)
            .body(img.bytes.clone())
            .unwrap();
    }

    Response::builder().status(404).body(Vec::new()).unwrap()
}

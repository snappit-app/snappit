mod snap_overlay;
use snap_overlay::SnapOverlay;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn show_snap_overlay(app: tauri::AppHandle) -> tauri::Result<()> {
    SnapOverlay.show(&app).await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, show_snap_overlay])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

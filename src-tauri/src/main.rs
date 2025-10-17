// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use colored::Colorize;

fn main() {
    snappit_lib::run().unwrap_or_else(|e: tauri::Error| {
        log::error!("{} {}", "error while running tauri app".red(), e);
        std::process::exit(1);
    });
}

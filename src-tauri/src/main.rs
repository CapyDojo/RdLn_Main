// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ocr;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            ocr::extract_text_from_image_tauri,
            ocr::detect_language_tauri,
            ocr::get_available_languages_tauri
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
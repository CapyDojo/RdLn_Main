/**
 * Tauri OCR Module
 * 
 * Provides native OCR functionality for Tauri builds using system Tesseract CLI.
 * This approach avoids complex native library dependencies while providing excellent performance.
 */

use base64::{Engine as _, engine::general_purpose};
use std::path::PathBuf;
use tokio::process::Command;
use tokio::fs;
use tauri::Manager;

#[tauri::command]
pub async fn extract_text_from_image_tauri(
    app: tauri::AppHandle,
    image_data: String,
    language: String,
) -> Result<String, String> {
    println!("🔧 Tauri OCR: Starting text extraction for language: {}", language);

    // Decode base64 image data
    let base64_data = image_data
        .split(',')
        .nth(1)
        .ok_or("Invalid image data format - missing base64 data")?;

    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64 image: {}", e))?;

    println!("🔧 Tauri OCR: Decoded image, size: {} bytes", image_bytes.len());

    // Create temporary file for image
    let temp_dir = std::env::temp_dir();
    let temp_image_path = temp_dir.join(format!("tauri_ocr_{}.png", uuid::Uuid::new_v4()));
    
    // Write image to temp file
    fs::write(&temp_image_path, &image_bytes).await
        .map_err(|e| format!("Failed to write temp image file: {}", e))?;

    println!("🔧 Tauri OCR: Created temp image file: {:?}", temp_image_path);

    // Get tessdata path from bundled resources
    let tessdata_path = get_tessdata_path(&app)?;
    println!("🔧 Tauri OCR: Using tessdata path: {:?}", tessdata_path);

    // Run Tesseract CLI
    let result = run_tesseract_cli(&temp_image_path, &tessdata_path, &language).await;

    // Cleanup temp file
    let _ = fs::remove_file(&temp_image_path).await;

    match result {
        Ok(text) => {
            println!("✅ Tauri OCR: Text extraction completed, length: {} characters", text.len());
            Ok(text)
        }
        Err(e) => {
            println!("❌ Tauri OCR: Text extraction failed: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub async fn detect_language_tauri(
    _app: tauri::AppHandle,
    _image_data: String,
) -> Result<Vec<String>, String> {
    println!("🔧 Tauri OCR: Starting language detection");

    // For now, return English as detected language
    // Language detection via CLI is complex and not essential for initial implementation
    println!("✅ Tauri OCR: Language detection completed (defaulting to English)");
    
    Ok(vec!["eng".to_string()])
}

/// Run Tesseract CLI command
async fn run_tesseract_cli(
    image_path: &PathBuf,
    tessdata_path: &PathBuf,
    language: &str,
) -> Result<String, String> {
    println!("🔧 Tauri OCR: Running Tesseract CLI with language: {}", language);

    // Check if Tesseract CLI is available first
    let tesseract_check = Command::new("tesseract")
        .arg("--version")
        .output()
        .await;

    if tesseract_check.is_err() {
        return Err("Tesseract CLI is not installed on this system. Please install Tesseract OCR to use native OCR functionality.".to_string());
    }

    // Build Tesseract command
    let output = Command::new("tesseract")
        .arg(image_path)
        .arg("stdout") // Output to stdout instead of file
        .arg("-l")
        .arg(language)
        .arg("--tessdata-dir")
        .arg(tessdata_path)
        .output()
        .await
        .map_err(|e| format!("Failed to execute Tesseract CLI: {}. Make sure Tesseract is installed on the system.", e))?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).to_string();
        println!("✅ Tauri OCR: Tesseract CLI completed successfully");
        Ok(text)
    } else {
        let error = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Tesseract CLI failed: {}", error))
    }
}

/// Get the tessdata directory path from Tauri's bundled resources
fn get_tessdata_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let resource_dir = app.path().resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?;
    
    let tessdata_path = resource_dir.join("tessdata");
    
    // Verify the tessdata directory exists
    if !tessdata_path.exists() {
        return Err(format!(
            "Tessdata directory not found at: {:?}. Ensure tessdata files are bundled in resources.", 
            tessdata_path
        ));
    }
    
    Ok(tessdata_path)
}

#[tauri::command]
pub async fn get_available_languages_tauri(
    app: tauri::AppHandle,
) -> Result<Vec<String>, String> {
    println!("🔧 Tauri OCR: Getting available languages");

    let tessdata_path = get_tessdata_path(&app)?;
    
    // Read tessdata directory to find available language files
    let mut languages = Vec::new();
    
    match std::fs::read_dir(&tessdata_path) {
        Ok(entries) => {
            for entry in entries {
                if let Ok(entry) = entry {
                    let path = entry.path();
                    if let Some(extension) = path.extension() {
                        if extension == "traineddata" {
                            if let Some(stem) = path.file_stem() {
                                if let Some(lang_code) = stem.to_str() {
                                    languages.push(lang_code.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Failed to read tessdata directory: {}", e));
        }
    }
    
    languages.sort();
    println!("✅ Tauri OCR: Found {} available languages: {:?}", languages.len(), languages);
    
    Ok(languages)
}
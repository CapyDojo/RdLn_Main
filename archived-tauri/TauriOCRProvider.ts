/**
 * Tauri OCR Provider
 * 
 * Provides OCR functionality specifically for Tauri builds using the native Rust backend.
 * This provider is completely separate from the web/Electron OCR implementation.
 */

import type { OCRLanguage, OCROptions } from '../types/ocr-types';

export class TauriOCRProvider {
  /**
   * Extract text from image using Tauri's native OCR backend
   */
  public static async extractTextFromImage(
    imageFile: File | Blob,
    options: OCROptions = {}
  ): Promise<string> {
    try {
      // Starting OCR extraction

      // Convert image to base64 for passing to Rust backend
      const imageData = await this.fileToBase64(imageFile);
      
      // Determine language to use
      let language = 'eng'; // Default to English
      
      if (options.autoDetect !== false && !options.languages?.length) {
        // Auto-detect language if no specific language provided
        try {
          console.log('🔍 TauriOCRProvider: Auto-detecting language');
          const detectedLanguages = await this.detectLanguage(imageFile);
          if (detectedLanguages.length > 0) {
            language = detectedLanguages[0];
            console.log('✅ TauriOCRProvider: Detected language:', language);
          }
        } catch (error) {
          console.warn('⚠️ TauriOCRProvider: Language detection failed, using English:', error);
        }
      } else if (options.languages && options.languages.length > 0) {
        // Use first specified language
        language = options.languages[0];
        // Using specified language
      }

      // Use primary language if specified
      if (options.primaryLanguage) {
        language = options.primaryLanguage;
        // Using primary language
      }

      console.log('🚀 TauriOCRProvider: Calling Tauri backend for OCR');

      // Dynamically import Tauri API to avoid issues in web environment
      const { invoke } = await import('@tauri-apps/api/core');

      // Call Tauri backend
      const text = await invoke<string>('extract_text_from_image_tauri', {
        imageData,
        language
      });

      console.log('✅ TauriOCRProvider: OCR extraction completed successfully');
      console.log(`📊 TauriOCRProvider: Extracted ${text.length} characters`);

      return text;

    } catch (error) {
      console.error('❌ TauriOCRProvider: OCR extraction failed:', error);
      
      // Check if it's a Tesseract CLI installation issue
      if (error && typeof error === 'string' && error.includes('Tesseract CLI is not installed')) {
        throw new Error(`Tesseract CLI is not installed on this system. Please install Tesseract OCR to use native OCR functionality. Error: ${error}`);
      }
      
      throw new Error(`Failed to extract text from image: ${error}`);
    }
  }

  /**
   * Detect language from image using Tauri's native OCR backend
   */
  public static async detectLanguage(imageFile: File | Blob): Promise<OCRLanguage[]> {
    try {
      console.log('🔍 TauriOCRProvider: Starting language detection');

      // Convert image to base64
      const imageData = await this.fileToBase64(imageFile);

      // Dynamically import Tauri API
      const { invoke } = await import('@tauri-apps/api/core');

      // Call Tauri backend for language detection
      const languages = await invoke<string[]>('detect_language_tauri', {
        imageData
      });

      console.log('✅ TauriOCRProvider: Language detection completed:', languages);

      return languages as OCRLanguage[];

    } catch (error) {
      console.error('❌ TauriOCRProvider: Language detection failed:', error);
      // Return English as fallback
      return ['eng'];
    }
  }

  /**
   * Get list of available languages from Tauri backend
   */
  public static async getAvailableLanguages(): Promise<OCRLanguage[]> {
    try {
      // Getting available languages

      // Dynamically import Tauri API
      const { invoke } = await import('@tauri-apps/api/core');

      const languages = await invoke<string[]>('get_available_languages_tauri');

      console.log('✅ TauriOCRProvider: Available languages:', languages);

      return languages as OCRLanguage[];

    } catch (error) {
      console.error('❌ TauriOCRProvider: Failed to get available languages:', error);
      // Return common languages as fallback
      return ['eng', 'chi_sim', 'chi_tra', 'spa', 'fra', 'deu', 'jpn', 'kor', 'ara', 'rus'];
    }
  }

  /**
   * Convert File or Blob to base64 data URL
   */
  private static fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert file to base64'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if we're running in Tauri environment
   */
  public static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
  }
}
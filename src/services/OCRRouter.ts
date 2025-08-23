/**
 * OCR Router
 * 
 * Routes OCR requests to the appropriate provider based on the environment.
 * This is the ONLY file that touches the existing OCR system.
 */

import type { OCROptions } from '../types/ocr-types';

export class OCRRouter {
  /**
   * Detect if we're running in Tauri environment
   */
  private static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
  }

  /**
   * Route OCR request to appropriate provider
   * 
   * @param imageFile - Image to process
   * @param options - OCR options
   * @param fallbackFunction - Existing OCR function for web/Electron
   * @returns Promise<string> - Extracted text
   */
  public static async routeOCRRequest(
    imageFile: File | Blob,
    options: OCROptions = {},
    fallbackFunction: (imageFile: File | Blob, options: OCROptions) => Promise<string>
  ): Promise<string> {
    
    // Always use fallback function for now (TauriOCRProvider not implemented)
    return fallbackFunction(imageFile, options);
  }

  /**
   * Route language detection request to appropriate provider
   * 
   * @param imageFile - Image to analyze
   * @param fallbackFunction - Existing language detection function for web/Electron
   * @returns Promise<OCRLanguage[]> - Detected languages
   */
  public static async routeLanguageDetection(
    imageFile: File | Blob,
    fallbackFunction: (imageFile: File | Blob) => Promise<any[]>
  ): Promise<any[]> {
    
    // Always use fallback function for now (TauriOCRProvider not implemented)
    return fallbackFunction(imageFile);
  }
}
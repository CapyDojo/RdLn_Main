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
    
    const isTauri = this.isTauriEnvironment();
    console.log('🔧 OCRRouter: Environment check - isTauri:', isTauri, 'window.__TAURI__:', typeof window !== 'undefined' ? !!(window as any).__TAURI__ : 'no window');
    
    if (isTauri) {
      console.log('🔧 OCRRouter: Routing to Tauri native OCR backend');
      try {
        // Dynamically import TauriOCRProvider to avoid issues in web environment
        console.log('🔧 OCRRouter: Attempting to import TauriOCRProvider...');
        const { TauriOCRProvider } = await import('./TauriOCRProvider');
        console.log('✅ OCRRouter: TauriOCRProvider imported successfully');
        return TauriOCRProvider.extractTextFromImage(imageFile, options);
      } catch (error) {
        console.error('❌ OCRRouter: Failed to load TauriOCRProvider, falling back:', error);
        return fallbackFunction(imageFile, options);
      }
    } else {
      console.log('🔧 OCRRouter: Routing to existing web/Electron OCR implementation');
      return fallbackFunction(imageFile, options);
    }
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
    
    const isTauri = this.isTauriEnvironment();
    console.log('🔧 OCRRouter: Language detection - isTauri:', isTauri);
    
    if (isTauri) {
      console.log('🔧 OCRRouter: Routing language detection to Tauri backend');
      try {
        // Dynamically import TauriOCRProvider to avoid issues in web environment
        console.log('🔧 OCRRouter: Importing TauriOCRProvider for language detection...');
        const { TauriOCRProvider } = await import('./TauriOCRProvider');
        console.log('✅ OCRRouter: TauriOCRProvider imported for language detection');
        return TauriOCRProvider.detectLanguage(imageFile);
      } catch (error) {
        console.error('❌ OCRRouter: Failed to load TauriOCRProvider for language detection, falling back:', error);
        return fallbackFunction(imageFile);
      }
    } else {
      console.log('🔧 OCRRouter: Routing language detection to existing implementation');
      return fallbackFunction(imageFile);
    }
  }
}
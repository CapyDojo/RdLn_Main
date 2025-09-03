/**
 * OCR Service - Main Interface
 * 
 * Provides a simplified interface for OCR text extraction with multi-language support.
 * This service coordinates between the OCR Router and the underlying OCR Engine.
 */

import { OCRLanguage, OCROptions, LanguageOption } from '../types/ocr-types';
import { SUPPORTED_LANGUAGES } from '../config/ocrConfig';
import { OCRRouter } from './OCRRouter';

export class OCRService {
  /**
   * Extracts text from an image file using the most appropriate OCR engine.
   * It routes the request via OCRRouter to handle different environments (e.g., web, Tauri).
   * @param imageFile The image file (File or Blob) from which to extract text.
   * @param options Configuration options for the OCR process.
   * @returns A promise that resolves to the extracted text as a string.
   */
  public static async extractTextFromImage(
    imageFile: File | Blob, 
    options: OCROptions = {}
  ): Promise<string> {
    // OCRRouter will select the appropriate engine based on the environment.
    const result = await OCRRouter.routeOCRRequest(imageFile, options, async (file, opts) => {
      // This default callback is for the web environment, using OCR_Engine_New.
      const { OCR_Engine_New } = await import('./OCR_Engine_New');
      const engineResult = await OCR_Engine_New.extract(file, opts);
      return engineResult.text;
    });
    
    return result;
  }

  /**
   * Retrieves information about a supported language.
   * @param languageCode The code for the language (e.g., 'eng').
   * @returns A LanguageOption object if the language is supported, otherwise undefined.
   */
  public static getLanguageInfo(languageCode: OCRLanguage): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  }
}

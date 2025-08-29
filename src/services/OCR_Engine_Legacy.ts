/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine_Legacy: Thin wrapper over the existing legacy OCR stack.
 *
 * Purpose:
 * - Isolate all direct calls to legacy services (LanguageDetectionService, OCRService).
 * - Allow OCR_Engine to switch between legacy and future pipelines without touching callers.
 */

import { OCROptions, OCRLanguage } from '../types/ocr-types';
import { LanguageDetectionService } from './LanguageDetectionService';
import { OCRService } from './OCRService';

export interface LegacyDetectOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal; // reserved for future cancellation wiring
}

export interface LegacyExtractResult {
  text: string;
  detectedLanguages?: OCRLanguage[];
}

export class OCR_Engine_Legacy {
  /**
   * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
   * Forward to LanguageDetectionService with optional progress.
   */
  static async detectLanguages(
    imageFile: File | Blob,
    options: LegacyDetectOptions = {}
  ): Promise<OCRLanguage[]> {
    return LanguageDetectionService.detectLanguage(imageFile, options.onProgress);
  }

  /**
   * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
   * Forward to OCRService for extraction. Normalize autoDetect based on languages provided.
   */
  static async extract(
    imageFile: File | Blob,
    options: OCROptions = {}
  ): Promise<LegacyExtractResult> {
    const normalized: OCROptions = {
      ...options,
      autoDetect: options.languages && options.languages.length > 0 ? false : options.autoDetect,
    };

    const text = await OCRService.extractTextFromImage(imageFile, normalized);
    return { text };
  }
}

export default OCR_Engine_Legacy;


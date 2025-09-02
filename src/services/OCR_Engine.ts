/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine: Single front door for the OCR pipeline.
 *
 * Purpose:
 * - Centralize all OCR calls (detection + extraction) behind one import.
 * - Delegate to OCR_Engine_New as the primary implementation.
 * - Keep this file's public API stable for useOCR.
 */

import { OCROptions, OCRLanguage } from '../types/ocr-types';
import { OCR_Engine_New } from './OCR_Engine_New';
import { appConfig } from '../config/appConfig';

export interface DetectOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal; // reserved for future cancellation wiring
}

export interface ExtractResult {
  text: string;
}

export class OCR_Engine {
  /**
   * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
   * Detect languages with progress support using the current stack.
   */
  static async detectLanguages(
    imageFile: File | Blob,
    options: DetectOptions = {}
  ): Promise<OCRLanguage[]> {
    // 20250829 - OCR_Engine refactor - code change - Codex/GPT5
    // New engine is one-stop (detect+extract). Keep this for backward compatibility only.
    console.warn('[OCR_Engine] detectLanguages is deprecated. Use extract() with auto-detect.');
    // Soft behavior: return empty array to indicate caller should rely on extract()
    return [];
  }

  /**
   * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
   * Extract text using the current OCR services. If languages are provided,
   * force autoDetect=false to prevent duplicate detection.
   */
  static async extract(
    imageFile: File | Blob,
    options: OCROptions = {}
  ): Promise<ExtractResult> {
    // 20250829 - OCR_Engine refactor - code change - Codex/GPT5
    const { text } = await OCR_Engine_New.extract(imageFile, options as any);
    return { text };
  }
}

export default OCR_Engine;
/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine: A thin gating facade for the OCR pipeline.
 *
 * Purpose:
 * - To act as a single, stable entry point (a "gate") for all OCR operations.
 * - Allows plugging in/out different underlying OCR engine implementations (e.g., OCR_Engine_New).
 * - Centralizes all OCR calls (detection + extraction) behind this facade.
 * - Keeps this file's public API stable for consumers like useOCR.
 */

import { OCROptions, OCRLanguage } from '../types/ocr-types';

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
   * Extract text using the current OCR services. If languages are provided,
   * force autoDetect=false to prevent duplicate detection.
   */
  static async extract(
    imageFile: File | Blob,
    options: OCROptions = {}
  ): Promise<ExtractResult> {
    const { OCR_Engine_New } = await import('./OCR_Engine_New');
    const { text } = await OCR_Engine_New.extract(imageFile, options as any);
    return { text };
  }
}

export default OCR_Engine;
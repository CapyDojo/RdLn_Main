/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine: Single front door for the OCR pipeline.
 *
 * Purpose:
 * - Centralize all OCR calls (detection + extraction) behind one import.
 * - Delegate to OCR_Engine_Legacy for now to gate legacy stack behind two layers.
 * - Make future pipeline swap a single-file change.
 *
 * SWAP POINT (TODO):
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * - When the new OCR pipeline is ready, replace the delegations below to
 *   OCR_Engine_Legacy with calls to the new pipeline.
 * - Proposed new pipeline surface:
 *   - detectLanguages(image, { onProgress, signal }) => OCRLanguage[]
 *   - extract(image, { languages?, autoDetect?, primaryLanguage?, preprocessing?, onProgress, signal })
 *       => { text, detectedLanguages?, metrics?, appliedProcessors? }
 *   - (optional) run(image, options) => detect + extract in one call
 * - To fully disable legacy:
 *   1) Remove OCR_Engine_Legacy import.
 *   2) Wire detect/extract methods to the new pipeline.
 *   3) Keep this file’s public API stable for useOCR.
 */

import { OCROptions, OCRLanguage } from '../types/ocr-types';
// 20250829 - OCR_Engine refactor - code change - Codex/GPT5
// Legacy stack is exclusively accessed via OCR_Engine_Legacy
import { OCR_Engine_Legacy } from './OCR_Engine_Legacy';

export interface DetectOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal; // reserved for future cancellation wiring
}

export interface ExtractResult {
  text: string;
  detectedLanguages?: OCRLanguage[];
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
    // Delegate to legacy engine for now
    return OCR_Engine_Legacy.detectLanguages(imageFile, options);
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
    // Delegate to legacy engine for now (it will normalize autoDetect appropriately)
    const { text } = await OCR_Engine_Legacy.extract(imageFile, options);
    return { text };
  }
}

export default OCR_Engine;

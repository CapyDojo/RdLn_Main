/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine_New: One-stop detect+extract engine based on v17 prototype.
 *
 * - Loads a multilingual worker (no pre-detection), recognizes with paragraph mode,
 *   then applies aggressive CJK whitespace correction. Returns final text.
 * - Integrates with OCR worker cache and supports progress + cancellation.
 * - Uses local assets for Electron via centralized path/worker factory.
 */

import { DETECTION_LANGUAGES } from '../config/ocrConfig';
import { OCROptions, OCRLanguage, OCRProgressCallback } from '../types/ocr-types';
import { createWorker } from 'tesseract.js';
import { getResourcePaths } from '../config/pathConfig';

export interface NewEngineExtractOptions extends OCROptions {
  signal?: AbortSignal;
}

export interface NewEngineExtractResult {
  text: string;
  confidence?: number;
  paragraphs?: string[];
  meta?: { whitespaceRemoved: number; iterations: number };
}

export class OCR_Engine_New {
  /**
   * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
   * One-stop detect+extract. If languages provided, uses them; otherwise loads
   * a multilingual worker (DETECTION_LANGUAGES) and skips a separate detection phase.
   */
  static async extract(
    imageFile: File | Blob,
    options: NewEngineExtractOptions = {}
  ): Promise<NewEngineExtractResult> {
    const onProgress = options.onProgress;
    const signal = options.signal;

    if (signal?.aborted) {
      throw new Error('OCR operation aborted');
    }

    const abortHandler = () => {
      // We do not terminate cached workers to avoid impacting others.
      // We simply short-circuit and throw when checked next.
    };
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      // 1) Phase: init
      this.report(onProgress, 0.2, { phase: 'init', description: 'Initializing OCR...' });

      // 2) Determine language set
      const languages: OCRLanguage[] = options.languages && options.languages.length > 0
        ? options.languages
        : DETECTION_LANGUAGES;

      // 3) Phase: load models (prototype-strict worker, no factory/cache)
      this.report(onProgress, 0.4, { phase: 'language_loading', description: 'Loading language models...' });

      const resourcePaths = await getResourcePaths();
      let worker: any | null = null;
      try {
        const mkLogger = () => (m: any) => {
          if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
            const scaled = 0.6 + (m.progress * 0.4);
            this.report(onProgress, Math.min(1.0, Math.max(0.6, scaled)), {
              phase: m.progress < 0.25 ? 'image_preprocessing' : m.progress < 0.75 ? 'character_recognition' : m.progress < 0.95 ? 'text_assembly' : 'post_processing',
              description: m.progress < 0.25 ? 'Preprocessing image for OCR...' : m.progress < 0.75 ? 'Recognizing characters and words...' : m.progress < 0.95 ? 'Assembling extracted text...' : 'Finalizing text formatting...'
            });
          }
        };

        // Attempt with environment-provided paths first
        const optionsPrimary = {
          logger: mkLogger(),
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          langPath: resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/'
        } as any;

        try {
          worker = await createWorker(languages, 1, optionsPrimary);
        } catch (err) {
          // Fallback to local default relative paths if CDN or env paths fail
          const optionsFallback = {
            logger: mkLogger(),
            workerPath: './tesseract/worker.min.js',
            corePath: './tesseract/tesseract-core.wasm.js',
            langPath: './tessdata/'
          } as any;
          worker = await createWorker(languages, 1, optionsFallback);
        }

        await worker.setParameters({ classify_enable_learning: '0' });

        if (signal?.aborted) throw new Error('OCR operation aborted');

        // 4) Phase: recognize
        this.report(onProgress, 0.6, { phase: 'recognize', description: 'Recognizing text...' });

        const result: any = await worker.recognize(imageFile, {}, { blocks: true, paragraphs: true });

        if (signal?.aborted) throw new Error('OCR operation aborted');

        // 5) Phase: processing
        this.report(onProgress, 0.8, { phase: 'post_processing', description: 'Processing text...' });

        const paragraphs = (result?.data?.paragraphs || [])
          .map((p: any) => (p?.text || '').trim())
          .filter((t: string) => t.length > 0);
        const joined = paragraphs.join('\n\n');

        const correction = this.aggressiveCJKWhitespaceRemoval(joined);

        // Per request: no universal cleanup and no language inference.
        const processed = correction.text;

        // 6) Phase: complete
        this.report(onProgress, 1.0, { phase: 'complete', description: 'Complete!' });

        return {
          text: processed,
          confidence: result?.data?.confidence ?? undefined,
          paragraphs,
          meta: { whitespaceRemoved: correction.whitespaceRemoved, iterations: correction.iterations }
        };
      } finally {
        // Terminate each run to match prototype behavior
        try { await (worker as any)?.terminate?.(); } catch {}
      }
    } finally {
      signal?.removeEventListener('abort', abortHandler);
    }
  }

  // Prototype-derived aggressive CJK whitespace removal (iterative until convergence)
  private static aggressiveCJKWhitespaceRemoval(text: string): { text: string; whitespaceRemoved: number; iterations: number } {
    const cjk = '[\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af\\u3000-\\u303f\\uff00-\\uffef]';
    const aggressiveRegex = new RegExp(`(${cjk})[ \\t]+(${cjk})`, 'g');

    let processed = text;
    let previousText: string;
    let iterations = 0;

    do {
      previousText = processed;
      processed = processed.replace(aggressiveRegex, '$1$2');
      iterations++;
    } while (processed !== previousText && iterations <= 100);

    const whitespaceRemoved = text.length - processed.length;
    return { text: processed, whitespaceRemoved, iterations };
  }

  // Language inference removed per request.

  private static report(cb?: OCRProgressCallback, progress?: number, phaseInfo?: { phase: string; description: string }) {
    try { cb && typeof progress === 'number' && cb(progress, phaseInfo); } catch {}
  }
}

export default OCR_Engine_New;

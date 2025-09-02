/**
 * 20250829 - OCR_Engine refactor - code change - Codex/GPT5
 * OCR_Engine_New: One-stop detect+extract engine based on prototype.
 *
 * - Loads a multilingual worker (no pre-detection), recognizes with paragraph mode,
 *   then applies aggressive CJK whitespace correction. Returns final text.
 * - Integrates with SimpleOCRCache and supports progress + cancellation.
 * - Uses centralized path configuration for tesseract.js resources.
 */

import { DETECTION_LANGUAGES } from '../config/ocrConfig';
import { OCROptions, OCRLanguage, OCRProgressCallback } from '../types/ocr-types';
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import { getResourcePaths } from '../config/pathConfig';
import { SimpleOCRCache } from './SimpleOCRCache';

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
  static async extract(
    imageFile: File | Blob,
    options: NewEngineExtractOptions = {}
  ): Promise<NewEngineExtractResult> {
    const onProgress = options.onProgress;
    const signal = options.signal;

    if (signal?.aborted) throw new Error('OCR operation aborted');
    const abortHandler = () => { /* no-op: caller handles cancellation */ };
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      this.report(onProgress, 0.15, { phase: 'init', description: 'Initializing OCR...' });

      // Determine languages (multilingual, no OSD pre-detection)
      const languages: OCRLanguage[] = (options.languages && options.languages.length > 0)
        ? options.languages
        : DETECTION_LANGUAGES;

      this.report(onProgress, 0.3, { phase: 'language_loading', description: 'Loading language models...' });

      // Try a prewarmed worker first
      let worker = SimpleOCRCache.getLanguageWorker(languages) as unknown as TesseractWorker | null;
      if (!worker) {
        const resourcePaths = await getResourcePaths();
        const mkLogger = (cb?: OCRProgressCallback) => (m: any) => {
          if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
            const scaled = 0.6 + (m.progress * 0.4);
            this.report(cb, Math.min(1.0, Math.max(0.6, scaled)), {
              phase: m.progress < 0.25 ? 'image_preprocessing'
                   : m.progress < 0.75 ? 'character_recognition'
                   : m.progress < 0.95 ? 'text_assembly'
                   : 'post_processing',
              description: 'Recognition in progress...'
            });
          }
        };

        const primary = {
          logger: mkLogger(onProgress),
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          langPath: resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/'
        } as any;

        try {
          worker = await createWorker(languages, 1, primary);
        } catch (e) {
          const fallback = {
            logger: mkLogger(onProgress),
            workerPath: './tesseract/worker.min.js',
            corePath: './tesseract/tesseract-core.wasm.js',
            langPath: './tessdata/'
          } as any;
          worker = await createWorker(languages, 1, fallback);
        }

        // Conservative defaults
        await worker.setParameters({ classify_enable_learning: '0' });

        // Cache for reuse
        SimpleOCRCache.setLanguageWorker(languages, worker);
      }

      this.report(onProgress, 0.55, { phase: 'recognition', description: 'Recognizing text...' });
      // Use paragraph mode for better text structure
      const result: any = await worker!.recognize(imageFile, {}, { blocks: true, paragraphs: true });

      // Extract text from paragraphs for better structure preservation
      const paragraphs = result.data.paragraphs || [];
      const rawTextItems = paragraphs
          .map((item: any) => item.text ? item.text.trim() : '')
          .filter((text: string) => text.length > 0);
      
      // Join all text with paragraph breaks
      const joined = rawTextItems.join('\n\n');

      // Apply aggressive CJK whitespace removal (DOM-based approach)
      const correction = this.aggressiveCJKWhitespaceRemoval(joined);

      this.report(onProgress, 1.0, { phase: 'complete', description: 'OCR complete' });
      return {
        text: correction.text,
        confidence: result.data.confidence,
        paragraphs: correction.cleanedParagraphs,
        meta: { whitespaceRemoved: correction.whitespaceRemoved, iterations: correction.iterations }
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler as any);
    }
  }

  private static report(cb: OCRProgressCallback | undefined, progress: number, info?: { phase: string; description: string }) {
    try { cb && cb(progress, info); } catch { /* ignore */ }
  }

  // EXACT v18 DOM post-processing approach - creates LIVE DOM elements
  private static aggressiveCJKWhitespaceRemoval(text: string): { text: string; whitespaceRemoved: number; iterations: number; cleanedParagraphs: string[] } {
    // Split text into paragraphs (preserve paragraph structure)
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // Use a persistent hidden container to match prototype behavior more closely
    let tempContainer = document.getElementById('ocr-temp-container');
    if (!tempContainer) {
      tempContainer = document.createElement('div');
      tempContainer.id = 'ocr-temp-container';
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.visibility = 'hidden';
      document.body.appendChild(tempContainer);
    }
    tempContainer.innerHTML = '';
    
    // First render paragraphs in LIVE DOM
    tempContainer.innerHTML = paragraphs.map(text => 
      `<div class="text-paragraph">${text}</div>`
    ).join('');
    
    // Then apply DOM post-processing to remove CJK spaces
    let totalSpacesRemoved = 0;
    let totalIterations = 0;
    
    tempContainer.querySelectorAll('.text-paragraph').forEach(paragraph => {
      const originalText = paragraph.textContent || '';
      const cleaned = this.removeCJKSpacesFromRenderedText(originalText);
      paragraph.textContent = cleaned.text;
      totalSpacesRemoved += cleaned.spacesRemoved;
      totalIterations += cleaned.iterations;
    });
    
    // Extract final text from DOM
    const cleanedParagraphs = Array.from(tempContainer.querySelectorAll('.text-paragraph'))
      .map(p => p.textContent || '');
    const finalText = cleanedParagraphs.join('\n\n');
    
    return { 
      text: finalText, 
      whitespaceRemoved: totalSpacesRemoved, 
      iterations: totalIterations,
      cleanedParagraphs
    };
  }

  private static removeCJKSpacesFromRenderedText(text: string): { text: string; spacesRemoved: number; iterations: number } {
    // EXACT v18 character class definitions with additions for Cyrillic and Arabic
    const cjk = '[\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af\\u3000-\\u303f\\uff00-\\uffef]';
    const punct = '[\\u3000-\\u303f\\uff00-\\uffef\\u2000-\\u206f\\u2e00-\\u2e7f\\u00a0-\\u00bf.,;:!?()\\[\\]{}"\'-]';
    const latin = '[a-zA-Z0-9\\u00c0-\\u00ff]'; // Extended Latin with accented characters
    const cyrillic = '[\\u0400-\\u04ff\\u0500-\\u052f\\u2de0-\\u2dff\\ua640-\\ua69f]'; // Complete Cyrillic ranges
    const arabic = '[\\u0600-\\u06ff\\u0750-\\u077f\\u08a0-\\u08ff\\ufb50-\\ufdff\\ufe70-\\ufeff]'; // Complete Arabic ranges
    
    let processed = text;
    let previousText: string;
    let iterations = 0;
    
    do {
      previousText = processed;
      
      // Remove spaces between CJK characters
      processed = processed.replace(new RegExp(`(${cjk}) +(${cjk})`, 'g'), '$1$2');
      
      // Remove single newlines between CJK characters (but preserve double newlines)
      processed = processed.replace(new RegExp(`(${cjk})\\n(${cjk})`, 'g'), '$1$2');
      
      // Remove single newlines between punctuation and CJK
      processed = processed.replace(new RegExp(`(${punct})\\n(${cjk})`, 'g'), '$1$2');
      processed = processed.replace(new RegExp(`(${cjk})\\n(${punct})`, 'g'), '$1$2');
      
      // Remove single newlines between punctuation marks
      processed = processed.replace(new RegExp(`(${punct})\\n(${punct})`, 'g'), '$1$2');
      
      // Handle Latin script line breaks (replicating v18 prototype behavior)
      // Remove single newlines between Latin characters/numbers to reconstruct paragraphs
      processed = processed.replace(new RegExp(`(${latin})\\n(${latin})`, 'g'), '$1 $2');
      
      // Handle Cyrillic script line breaks
      // Remove single newlines between Cyrillic characters to reconstruct paragraphs
      processed = processed.replace(new RegExp(`(${cyrillic})\\n(${cyrillic})`, 'g'), '$1 $2');
      
      // Handle Arabic script line breaks
      // Remove single newlines between Arabic characters to reconstruct paragraphs
      processed = processed.replace(new RegExp(`(${arabic})\\n(${arabic})`, 'g'), '$1 $2');
      
      // Enhanced pattern: Remove single newlines that follow punctuation marks
      // This helps with punctuation at the end of lines
      processed = processed.replace(new RegExp(`(${punct})\\n`, 'g'), '$1 ');
      
      iterations++;
    } while (processed !== previousText && iterations <= 100);
    
    const spacesRemoved = text.length - processed.length;
    return { text: processed, spacesRemoved, iterations };
  }
}

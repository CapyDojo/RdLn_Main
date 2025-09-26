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
import { appConfig } from '../config/appConfig';
import { OCRWorkerPool } from './OCRWorkerPool';
import { recordMetric } from './PerformanceMonitor';

export interface NewEngineExtractOptions extends OCROptions {
  signal?: AbortSignal;
}

export interface NewEngineExtractResult {
  text: string;
  confidence?: number;
  paragraphs?: string[];
  meta?: { whitespaceRemoved: number; iterations: number };
}

function isLocalPath(path?: string | null) {
  if (!path) {
    return false;
  }
  return path.startsWith('rdln://') || path.startsWith('./') || path.startsWith('file://');
}

// Global registry for job-specific progress callbacks
const jobProgressCallbacks = new Map<string, any>();
// Track which operation is expecting which job
const operationToJobMapping = new Map<string, string>();
let globalHandlerInstalled = false;

export class OCR_Engine_New {
  static async extract(
    imageFile: File | Blob,
    options: NewEngineExtractOptions = {}
  ): Promise<NewEngineExtractResult> {
    const onProgress = options.onProgress;
    const signal = options.signal;
    
    // Generate unique operation ID to track this specific OCR operation
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (signal?.aborted) throw new Error('OCR operation aborted');
    const abortHandler = () => { /* no-op: caller handles cancellation */ };
    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      // Determine languages (multilingual, no OSD pre-detection)
      const languages: OCRLanguage[] = (options.languages && options.languages.length > 0)
        ? options.languages
        : DETECTION_LANGUAGES;

      // If multiworker feature is enabled, use the pool for true parallelism
      if (appConfig.features.ENABLE_MULTIWORKER_OCR === true) {
        try {
          const poolSize = appConfig.cache.OCR.MULTIWORKER_POOL_SIZE || 2;
          await OCRWorkerPool.ensurePool(languages, poolSize);

          // Report start
          if (onProgress) {
            this.report(onProgress, 0.0, { phase: 'text_extraction', description: 'Extracting text...' });
          }

          const lease = await OCRWorkerPool.acquire(languages, {
            onProgress: (p: number) => {
              this.report(onProgress, p, { phase: 'text_extraction', description: 'Extracting text...' });
            },
            timeoutMs: 30_000
          });
          let result: any;
          try {
            const tStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            result = await (lease.worker as any).recognize(imageFile, {}, { blocks: true, text: true });
            const tEnd = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            try { recordMetric('ocr.recognize.ms', tEnd - tStart, 'ocr', { mode: 'pool' }); } catch {}
          } finally {
            await lease.release(false);
          }

          const rawText = result.data.text || '';
          const joined = rawText;
          const correction = this.aggressiveCJKWhitespaceRemoval(joined);
          this.report(onProgress, 1.0, { phase: 'text_extraction', description: 'OCR complete' });
          return {
            text: correction.text,
            confidence: result.data.confidence,
            paragraphs: correction.cleanedParagraphs,
            meta: { whitespaceRemoved: correction.whitespaceRemoved, iterations: correction.iterations }
          };
        } catch (poolError) {
          console.warn('[OCR] Multiworker pool path failed, falling back to single-worker path:', poolError);
          // Fall through to single-worker logic below
        }
      }

      // Try a prewarmed worker first
      if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] 🔍 Checking for prewarmed worker for languages: ${languages.join(',')}`);
      let worker = SimpleOCRCache.getLanguageWorker(languages) as TesseractWorker | null;
      if (worker) {
        if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] ✅ Using prewarmed worker for languages: ${languages.join(',')}`);
        // Note: Cannot update logger on existing worker due to DataCloneError
        // Progress callback will be handled during recognition if needed
      } else {
        if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] ❌ No prewarmed worker found for languages: ${languages.join(',')}, creating new worker`);
        const resourcePaths = await getResourcePaths();
        let coreLogged = false;
        const mkLogger = (cb?: OCRProgressCallback) => (m: any) => {
          if (!coreLogged && m?.status === 'loading tesseract core') {
            coreLogged = true;
            try {
              const core = resourcePaths.corePath || '';
              const auto = !core.endsWith('.wasm.js');
              const label = auto ? 'auto-select (directory)' : `explicit (${core.split('/').pop()})`;
              console.info(`[OCR] Tesseract core: ${label} at ${core}${auto ? ' — SIMD/LSTM expected if supported' : ''}`);
            } catch {}
          }
          // Only report real Tesseract progress during text recognition
          if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
            // Pass real progress directly (0.0 to 1.0)
            this.report(cb, m.progress, {
              phase: 'text_extraction',
              description: 'Extracting text...'
            });
          }
        };

        const primaryUseLocal = isLocalPath(resourcePaths.workerPath) || isLocalPath(resourcePaths.langPath);
        const primary = {
          logger: mkLogger(onProgress),
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          langPath: resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/',
          workerBlobURL: primaryUseLocal ? false : undefined,
          gzip: primaryUseLocal ? false : undefined
        };

        try {
          worker = await createWorker(languages, 1, primary);
          if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] 🔧 Created new primary worker for languages: ${languages.join(',')}`);
        } catch (e) {
          if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] 🔧 Falling back to default paths for worker for languages: ${languages.join(',')}`);
          const fallbackUseLocal = isLocalPath(resourcePaths.workerPath) || isLocalPath(resourcePaths.langPath);
          const fallback = {
            logger: mkLogger(onProgress),
            workerPath: resourcePaths.workerPath,
            // Prefer directory to allow SIMD/LSTM auto-selection when variants are bundled
            corePath: resourcePaths.corePath,
            langPath: resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/',
            workerBlobURL: fallbackUseLocal ? false : undefined,
            gzip: fallbackUseLocal ? false : undefined
          };
          worker = await createWorker(languages, 1, fallback);
          if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] 🔧 Created fallback worker for languages: ${languages.join(',')}`);
        }

        // Conservative defaults
        await worker.setParameters({ classify_enable_learning: '0' });

        // Cache for reuse
        SimpleOCRCache.setLanguageWorker(languages, worker);
        if (appConfig.dev.LOGGING.ENABLED) console.log(`[OCR_DEBUG] 💾 Cached new worker for languages: ${languages.join(',')}`);
      }

      // Use paragraph mode for better text structure
      // In Tesseract.js v6+, non-text formats are disabled by default, so we need to explicitly enable them
      
      // Report start of text extraction
      if (onProgress) {
        this.report(onProgress, 0.0, { phase: 'text_extraction', description: 'Extracting text...' });
      }
      
      // For prewarmed workers, set up job-specific progress tracking
      const isPrewarmedWorker = SimpleOCRCache.getLanguageWorker(languages) !== null;
      
      let actualJobId: string | null = null;
      
      if (onProgress && isPrewarmedWorker) {
        // Install global progress dispatcher if not already installed
        this.ensureGlobalProgressHandler(worker as any);
        
        // Create progress callback for this operation
        const progressCallback = (progress: number) => {
          this.report(onProgress, progress, {
            phase: 'text_extraction',
            description: 'Extracting text...'
          });
        };
        
        // Register callback with operation ID - we'll map to job ID when we get it
        actualJobId = operationId;
        jobProgressCallbacks.set(operationId, progressCallback);
      }
      
      // Start the recognition and immediately capture job mapping
      const recognizePromise = worker!.recognize(imageFile, {}, { 
        blocks: true, 
        text: true  // Explicitly enable text output (though it's enabled by default)
      });
      
      const result = await recognizePromise;
      
      // Clean up our job-specific callback and mappings
      if (actualJobId && isPrewarmedWorker) {
        // Clean up operation callback
        jobProgressCallbacks.delete(actualJobId);
        
        // Find and clean up job mapping
        const mappedJobId = operationToJobMapping.get(actualJobId);
        if (mappedJobId) {
          jobProgressCallbacks.delete(mappedJobId);
          operationToJobMapping.delete(actualJobId);
        }
      }

      // Extract text from paragraphs for better structure preservation
      // In newer versions of Tesseract.js, we might have paragraphs array
      // But for compatibility, we'll use the text directly and apply our own paragraph processing
      const rawText = result.data.text || '';
      
      // Join all text with paragraph breaks (apply our own processing)
      const joined = rawText;

      // Apply aggressive CJK whitespace removal (DOM-based approach)
      const correction = this.aggressiveCJKWhitespaceRemoval(joined);

      // Report completion
      this.report(onProgress, 1.0, { phase: 'text_extraction', description: 'OCR complete' });
      return {
        text: correction.text,
        confidence: result.data.confidence,
        paragraphs: correction.cleanedParagraphs,
        meta: { whitespaceRemoved: correction.whitespaceRemoved, iterations: correction.iterations }
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler);
    }
  }

  private static ensureGlobalProgressHandler(workerInstance: any) {
    if (!globalHandlerInstalled && workerInstance.worker && workerInstance.worker.onmessage) {
      const originalOnMessage = workerInstance.worker.onmessage;
      
      // Install global handler that dispatches to job-specific callbacks
      workerInstance.worker.onmessage = function(event: MessageEvent) {
        // Call original handler first (preserves console logging)
        if (originalOnMessage) {
          originalOnMessage.call(this, event);
        }
        
        const data = event.data;
        if (data && data.jobId && data.status === 'progress' && 
            data.data && typeof data.data.progress === 'number') {
          
          // Check if we have a callback registered for this specific jobId
          let callback = jobProgressCallbacks.get(data.jobId);
          
          if (!callback) {
            // This is a new job - find the most recently registered operation callback
            // that doesn't have a job mapping yet
            for (const [operationId, operationCallback] of jobProgressCallbacks.entries()) {
              if (!operationToJobMapping.has(operationId)) {
                // Map this operation to this job
                operationToJobMapping.set(operationId, data.jobId);
                jobProgressCallbacks.set(data.jobId, operationCallback);
                callback = operationCallback;
                break;
              }
            }
          }
          
          // Dispatch to the callback
          if (callback) {
            callback(data.data.progress);
          }
        }
      };
      
      globalHandlerInstalled = true;
    }
  }

  private static report(cb: OCRProgressCallback | undefined, progress: number, info?: { phase: string; description: string }) {
    // Only report progress if we have a callback
    if (cb) {
      try { 
        // Ensure progress is between 0 and 1
        const clampedProgress = Math.min(1.0, Math.max(0.0, progress));
        cb(clampedProgress, info); 
      } catch { 
        /* ignore callback errors */ 
      }
    }
  }

  // EXACT v18 DOM post-processing approach - creates LIVE DOM elements
  private static aggressiveCJKWhitespaceRemoval(text: string): { text: string; whitespaceRemoved: number; iterations: number; cleanedParagraphs: string[] } {
    // Split text into paragraphs (preserve paragraph structure)
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    // Create a temporary container for DOM manipulation
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.visibility = 'hidden';
    document.body.appendChild(tempContainer);
    
    try {
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
    } finally {
      // Clean up the temporary container
      document.body.removeChild(tempContainer);
    }
  }

  private static removeCJKSpacesFromRenderedText(text: string): { text: string; spacesRemoved: number; iterations: number } {
    // EXACT v18 character class definitions with additions for Cyrillic and Arabic
    const cjk = '[\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af\\u3000-\\u303f\\uff00-\\uffef]';
    const punct = '[\\u3000-\\u303f\\uff00-\\uffef\\u2000-\\u206f\\u2e00-\\u2e7f\\u00a0-\\u00bf.,;:!?()\\[\\]{}"\'-]';
    const latin = '[a-zA-Z0-9\u00c0-\u00ff]'; // Extended Latin with accented characters
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

/**
 * Simple OCR Cache - Direct prewarming implementation without OCRCacheManager
 * 
 * Provides a lightweight alternative to OCRCacheManager for prewarming OCR workers
 * during application initialization.
 */

import { createWorker } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { OCRLanguage } from '../types/ocr-types';
import { getResourcePaths } from '../config/pathConfig';
import { DETECTION_LANGUAGES } from '../config/ocrConfig';

// Type definitions
interface SimpleCachedWorker {
  worker: TesseractWorker;
  lastUsed: number;
  useCount: number;
  languages: OCRLanguage[];
  isShared?: boolean; // Mark shared workers to prevent termination
}

export class SimpleOCRCache {
  private static languageWorkers: Map<string, SimpleCachedWorker> = new Map();
  
  // Generate cache key for worker identification
  private static getWorkerKey(languages: OCRLanguage[]): string {
    return languages.sort().join('-');
  }
  
  // Set language worker
  static setLanguageWorker(languages: OCRLanguage[], worker: TesseractWorker) {
    const key = this.getWorkerKey(languages);
    this.languageWorkers.set(key, {
      worker,
      lastUsed: Date.now(),
      useCount: 1,
      languages
    });
  }
  
  // Get language worker
  static getLanguageWorker(languages: OCRLanguage[]): TesseractWorker | null {
    const key = this.getWorkerKey(languages);
    const cached = this.languageWorkers.get(key);
    
    if (cached) {
      cached.lastUsed = Date.now();
      cached.useCount++;
      return cached.worker;
    }
    
    return null;
  }
  
  // Terminate all workers and clear caches
  static async terminateAll() {
    try {
      for (const cached of Array.from(this.languageWorkers.values())) {
        try {
          await cached.worker.terminate();
        } catch (error) {
          console.warn('⚠️ Error terminating language worker:', error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error terminating workers:', error);
    } finally {
      this.languageWorkers.clear();
    }
  }
  
  // Get cache statistics
  static getStats() {
    return {
      languageWorkersCached: this.languageWorkers.size,
      totalWorkers: this.languageWorkers.size
    };
  }
}

export async function prewarmLanguageWorker(languages: OCRLanguage[] = ['eng'], onProgress?: (progress: number) => void): Promise<boolean> {
  try {
    // Check if already prewarmed
    if (SimpleOCRCache.getLanguageWorker(languages)) {
      console.log(`🔥 Language worker for ${languages.join(',')} already prewarmed`);
      return true;
    }
    
    console.log(`🔥 Prewarming language worker for: ${languages.join(',')}`);

    // Use centralized resource paths to match runtime configuration
    const paths = await getResourcePaths();
    const workerOptions = {
      logger: (m: any) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const progress = Math.round(m.progress * 100);
          if (onProgress) onProgress(progress / 100);
        }
      },
      workerPath: paths.workerPath,
      corePath: paths.corePath,
      langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
    } as any;

    // Create worker using LSTM engine (no OSD)
    const worker = await createWorker(languages, 1, workerOptions);

    // Apply conservative default parameters to align with OCR_Engine_New
    if (typeof (worker as any).setParameters === 'function') {
      await (worker as any).setParameters({ classify_enable_learning: '0' });
    }
    
    // Store in simple cache
    SimpleOCRCache.setLanguageWorker(languages, worker);
    console.log(`✅ Language worker for ${languages.join(',')} prewarmed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to prewarm language worker for ${languages.join(',')}:`, error);
    return false;
  }
}

// Modified OCR functions that use prewarmed workers
export async function detectLanguageWithPrewarmedWorker(imageFile: File | Blob): Promise<any> {
  try {
    // Use the multilingual worker for detection (aligns with OCR_Engine_New approach)
    const languages = [...DETECTION_LANGUAGES];
    let worker = SimpleOCRCache.getLanguageWorker(languages);
    
    if (!worker) {
      // Fallback to creating new worker if not prewarmed
      console.log('🔥 Creating new multilingual worker for detection (not prewarmed)');
      const paths = await getResourcePaths();
      worker = await createWorker(languages, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`🔥 Multilingual worker progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        workerPath: paths.workerPath,
        corePath: paths.corePath,
        langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
      } as any);
      
      // Apply conservative default parameters to align with OCR_Engine_New
      if (typeof (worker as any).setParameters === 'function') {
        await (worker as any).setParameters({ classify_enable_learning: '0' });
      }
      
      SimpleOCRCache.setLanguageWorker(languages, worker);
    }
    
    const result = await (worker as any).detect(imageFile);
    return result;
  } catch (error) {
    // If prewarmed worker fails, try creating a new one
    console.warn('⚠️ Prewarmed multilingual worker failed, creating new one:', error);
    const languages = [...DETECTION_LANGUAGES];
    const paths = await getResourcePaths();
    const newWorker = await createWorker(languages, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`🔥 New multilingual worker progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      workerPath: paths.workerPath,
      corePath: paths.corePath,
      langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
    } as any);
    
    // Apply conservative default parameters to align with OCR_Engine_New
    if (typeof (newWorker as any).setParameters === 'function') {
      await (newWorker as any).setParameters({ classify_enable_learning: '0' });
    }
    
    SimpleOCRCache.setLanguageWorker(languages, newWorker);
    const result = await (newWorker as any).detect(imageFile);
    return result;
  }
}

export async function extractTextWithPrewarmedWorker(imageFile: File | Blob, languages: OCRLanguage[] = ['eng']): Promise<string> {
  try {
    // Try to use prewarmed language worker
    let worker = SimpleOCRCache.getLanguageWorker(languages);
    
    if (!worker) {
      // Fallback to creating new worker if not prewarmed
      console.log(`🔥 Creating new worker for languages: ${languages.join(',')}`);
      const paths = await getResourcePaths();
      worker = await createWorker(languages, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`🔥 Worker progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        workerPath: paths.workerPath,
        corePath: paths.corePath,
        langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
      } as any);
      SimpleOCRCache.setLanguageWorker(languages, worker);
    }
    
    const result = await (worker as any).recognize(imageFile);
    return result.data.text;
  } catch (error) {
    // If prewarmed worker fails, try creating a new one
    console.warn(`⚠️ Prewarmed worker for ${languages.join(',')} failed, creating new one:`, error);
    const paths = await getResourcePaths();
    const newWorker = await createWorker(languages, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`🔥 New worker progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      workerPath: paths.workerPath,
      corePath: paths.corePath,
      langPath: paths.langPath.endsWith('/') ? paths.langPath : paths.langPath + '/',
    } as any);
    SimpleOCRCache.setLanguageWorker(languages, newWorker);
    const result = await (newWorker as any).recognize(imageFile);
    return result.data.text;
  }
}


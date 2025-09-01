/**
 * OCR Cache Manager - Simplified Version for OCR_Engine_New
 * 
 * Handles caching of Tesseract workers to optimize performance and resource utilization.
 * Streamlined version focused on worker reuse for monolithic OCR engines.
 */

import { createWorker } from 'tesseract.js';
import {
  CachedWorker,
  OCRLanguage,
  CacheStats,
  OCRProgressCallback
} from '../types/ocr-types';
import { CACHE_CONFIGURATION } from '../config/ocrConfig';
import { DEV_CONFIG } from '../config/appConfig';
import { getResourcePaths } from '../config/pathConfig';
import { OCRErrorHandler, OCRErrorUtils } from '../utils/ocrErrorHandling';
import { getTesseractPerformanceConfig, LANGUAGE_OPTIMIZATIONS, TesseractPerformanceConfig } from '../config/tesseractConfig';

/**
 * Deployment-aware worker factory configuration
 */
export interface WorkerFactoryOptions {
  languages: OCRLanguage[];
  deployment?: 'web' | 'electron' | 'auto';
  performanceMode?: 'FAST' | 'BALANCED' | 'ACCURATE';
  timeout?: number;
  onProgress?: OCRProgressCallback;
}

/**
 * Unified OCR Worker Factory for deployment-focused architecture
 */
export class OCRWorkerFactory {
  /**
   * Local logger for worker creation progress (mirrors phases used elsewhere)
   */
  private static createLogger(onProgress?: OCRProgressCallback) {
    const startTime = Date.now();
    let last = 0;
    return (m: any) => {
      const elapsed = Date.now() - startTime;
      if (!onProgress) return;

      if (m.status === 'loading tesseract core') {
        onProgress(0.15, { phase: 'core_loading', description: 'Loading Tesseract core...' });
      } else if (m.status === 'initializing tesseract') {
        onProgress(0.35, { phase: 'worker_creation', description: 'Initializing worker...' });
      } else if (m.status === 'loading language traineddata') {
        onProgress(0.65, { phase: 'language_loading', description: 'Loading language data...' });
      } else if (m.status === 'initializing api') {
        onProgress(0.85, { phase: 'api_init', description: 'Initializing API...' });
      } else if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const pct = Math.round(m.progress * 100);
        if (pct > last + 3 || m.progress >= 1) {
          last = pct;
          const subPhase = m.progress < 0.25 ? 'image_preprocessing' : m.progress < 0.75 ? 'character_recognition' : m.progress < 0.95 ? 'text_assembly' : 'post_processing';
          onProgress(m.progress, { phase: subPhase, description: 'Recognition in progress...' });
        }
      } else if (elapsed > 2000) {
        const synthetic = Math.min(0.9, elapsed / 10000);
        onProgress(synthetic, { phase: 'processing', description: 'Processing...' });
      }
    };
  }
  /**
   * Create worker using deployment-aware factory method
   * This is the new unified entry point for all worker creation
   */
  static async createWorker(options: WorkerFactoryOptions): Promise<Tesseract.Worker> {
    const {
      languages,
      deployment = 'auto',
      performanceMode = 'BALANCED',
      timeout = 15000,
      onProgress
    } = options;

    console.log('🏭 OCRWorkerFactory.createWorker called with:', {
      languages,
      deployment,
      performanceMode,
      timeout
    });

    try {
      // Auto-detect deployment if needed
      const targetDeployment = deployment === 'auto' 
        ? await this.detectDeployment()
        : deployment;

      console.log(`🎯 Target deployment: ${targetDeployment}`);

      // Route to appropriate worker creation method
      switch (targetDeployment) {
        case 'web':
          return await this.createWebWorker(languages, timeout, onProgress, performanceMode);
            
        case 'electron':
          return await this.createElectronWorker(languages, timeout, onProgress, performanceMode);
            
        default:
          throw new Error(`Unsupported deployment: ${targetDeployment}`);
      }
      
    } catch (error) {
      return OCRErrorHandler.handleWorkerValidationFailure(
        error,
        'OCRWorkerFactory.createWorker',
        () => this.createFallbackWorker(languages, timeout, onProgress, performanceMode)
      );
    }
  }

  /**
   * Auto-detect current deployment environment
   */
  private static async detectDeployment(): Promise<'web' | 'electron'> {
    // Check if running in actual Electron environment
    const isElectron = typeof window !== 'undefined' && (window as any).isElectron === true;
    
    if (isElectron) {
      console.log('🔍 Deployment detection: Actual Electron environment detected');
      return 'electron';
    } else {
      console.log('🔍 Deployment detection: Browser environment detected (including localhost development)');
      return 'web';
    }
  }

  /**
   * Create worker for web deployment using CDN resources
   */
  static async createWebWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    return OCRErrorHandler.withErrorHandling(
      'Web Worker Creation',
      async () => {
        console.log('🌐 Creating web worker with CDN resources for languages:', languages, 'useCase:', useCase);

        const perfConfig = getTesseractPerformanceConfig(useCase);
        let languageConfig: Partial<TesseractPerformanceConfig> = {};
        
        for (const lang of languages) {
          if (LANGUAGE_OPTIMIZATIONS[lang]) {
            languageConfig = { ...languageConfig, ...LANGUAGE_OPTIMIZATIONS[lang] };
          }
        }

        const finalConfig = { ...perfConfig, ...languageConfig };
        const { tessedit_ocr_engine_mode, ...parametersForLater } = finalConfig;

        // Web workers still need langPath for OSD data
        const resourcePaths = await getResourcePaths();
        const finalLangPath = resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/';
        
        console.log('🔍 DEBUG - Web worker paths:', {
          resourcePaths,
          finalLangPath,
          languages
        });
        
        const workerOptions = {
          logger: this.createLogger(onProgress),
          langPath: finalLangPath,
          legacyCore: true,
          legacyLang: true
        };

        const worker = await Promise.race([
          createWorker(languages, 1, workerOptions),
          OCRErrorUtils.createTimeoutPromise(timeout, 'Web Worker Creation')
        ]);

        if (Object.keys(parametersForLater).length > 0) {
          await worker.setParameters(parametersForLater);
        }
        
        console.log('✅ Web worker created successfully');
        return worker;
      },
      undefined,
      { languages, timeout, useCase }
    );
  }

  /**
   * Create worker for electron deployment using local resources
   */
  static async createElectronWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    return OCRErrorHandler.withErrorHandling(
      'Electron Worker Creation',
      async () => {
        console.log('⚡ Creating electron worker with local resources for languages:', languages, 'useCase:', useCase);

        const resourcePaths = await getResourcePaths();
        const perfConfig = getTesseractPerformanceConfig(useCase);
        let languageConfig: Partial<TesseractPerformanceConfig> = {};
        
        for (const lang of languages) {
          if (LANGUAGE_OPTIMIZATIONS[lang]) {
            languageConfig = { ...languageConfig, ...LANGUAGE_OPTIMIZATIONS[lang] };
          }
        }

        const finalConfig = { ...perfConfig, ...languageConfig };
        const { tessedit_ocr_engine_mode, ...parametersForLater } = finalConfig;

        const finalLangPath = resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/';
        
        console.log('🔍 DEBUG - Electron worker paths:', {
          resourcePaths,
          finalLangPath,
          languages
        });

        const workerOptions = {
          logger: this.createLogger(onProgress),
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          langPath: finalLangPath,
          legacyCore: true,
          legacyLang: true
        };

        const worker = await Promise.race([
          createWorker(languages, 1, workerOptions),
          OCRErrorUtils.createTimeoutPromise(timeout, 'Electron Worker Creation')
        ]);

        if (Object.keys(parametersForLater).length > 0) {
          await worker.setParameters(parametersForLater);
        }
        
        console.log('✅ Electron worker created successfully');
        return worker;
      },
      undefined,
      { languages, timeout, useCase }
    );
  }

  /**
   * Ultimate fallback worker creation
   */
  private static async createFallbackWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🚨 Creating ultimate fallback worker');
    
    try {
      // Try web worker as ultimate fallback
      return await this.createWebWorker(languages, timeout, onProgress, useCase);
    } catch (webError) {
      // If web fails, try with English only
      console.warn('⚠️ Web fallback failed, trying English-only');
      return await this.createWebWorker(['eng'], timeout, onProgress, 'FAST');
    }
  }
}

export class OCR_CacheManager_New {
  // PERFORMANCE CONSTANTS
  private static readonly CACHE_EXPIRY = CACHE_CONFIGURATION.cacheExpiryMs; // Cache expiry time
  private static workers: Map<string, CachedWorker> = new Map();
  private static loadingPromises: Map<string, Promise<Tesseract.Worker>> = new Map();

  // Cleanup timer
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /**
   * Creates an enhanced logger function for Tesseract worker progress with detailed phase tracking
   * @param onProgress Optional callback for real-time progress updates
   * @param phaseOffset Starting offset for this phase (0.0 to 1.0)
   * @param phaseWeight Weight of this phase in total progress (0.0 to 1.0)
   */
  private static createLogger(onProgress?: OCRProgressCallback, phaseOffset: number = 0, phaseWeight: number = 1) {
    let lastReportedProgress = 0;
    const startTime = Date.now();
    
    return (m: any) => {
      const elapsed = Date.now() - startTime;
      
      // Enhanced progress reporting with detailed phases
      if (m.status === 'loading tesseract core' && onProgress) {
        const phaseProgress = phaseOffset + (0.15 * phaseWeight); // 15% through this phase
        onProgress(phaseProgress, { 
          phase: 'core_loading', 
          description: 'Loading Tesseract processing engine...' 
        });
      } else if (m.status === 'initializing tesseract' && onProgress) {
        const phaseProgress = phaseOffset + (0.35 * phaseWeight); // 35% through this phase
        onProgress(phaseProgress, { 
          phase: 'worker_creation', 
          description: 'Creating OCR worker thread...' 
        });
      } else if (m.status === 'loading language traineddata' && onProgress) {
        const phaseProgress = phaseOffset + (0.65 * phaseWeight); // 65% through this phase
        onProgress(phaseProgress, { 
          phase: 'language_loading', 
          description: 'Loading language recognition data...' 
        });
      } else if (m.status === 'initializing api' && onProgress) {
        const phaseProgress = phaseOffset + (0.85 * phaseWeight); // 85% through this phase
        onProgress(phaseProgress, { 
          phase: 'api_init', 
          description: 'Initializing recognition API...' 
        });
      } else if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const progressPercent = Math.round(m.progress * 100);
        
        // Throttle progress updates to avoid UI flooding
        if (progressPercent > lastReportedProgress + 3 || m.progress >= 1.0) {
          console.log(`OCR progress: ${progressPercent}%`);
          lastReportedProgress = progressPercent;
          
          // Call the progress callback with detailed extraction phases
          if (onProgress) {
            const extractionProgress = phaseOffset + (m.progress * phaseWeight);
            const subPhase = m.progress < 0.25 ? 'image_preprocessing' :
                            m.progress < 0.75 ? 'character_recognition' :
                            m.progress < 0.95 ? 'text_assembly' : 'post_processing';
            
            const description = m.progress < 0.25 ? 'Preprocessing image for OCR...' :
                               m.progress < 0.75 ? 'Recognizing characters and words...' :
                               m.progress < 0.95 ? 'Assembling extracted text...' : 'Finalizing text formatting...';
            
            onProgress(extractionProgress, { 
              phase: subPhase, 
              description 
            });
          }
        }
      }
      
      // Add synthetic progress for long-running operations without specific progress
      else if (onProgress && elapsed > 2000) {
        // Synthetic progress based on elapsed time
        const estimatedDuration = 10000; // 10 seconds estimate
        const timeProgress = Math.min(0.9, elapsed / estimatedDuration);
        const syntheticProgress = phaseOffset + (timeProgress * phaseWeight * 0.8); // Cap at 80% for safety
        
        onProgress(syntheticProgress, { 
          phase: 'processing', 
          description: 'Processing request...' 
        });
      }
    };
  }

  /**
   * Generates a cache key for worker identification
   */
  private static getWorkerKey(languages: OCRLanguage[]): string {
    return languages.sort().join('-');
  }

  /**
   * Starts the cleanup timer for expired workers and cache entries
   */
  private static startCleanupTimer() {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, CACHE_CONFIGURATION.cleanupIntervalMs);
  }

  /**
   * Cleans up expired workers and manages cache size
   */
  private static async cleanupExpiredWorkers() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired workers
    for (const [key, cached] of this.workers.entries()) {
      if (now - cached.lastUsed > CACHE_CONFIGURATION.cacheExpiryMs) {
        expiredKeys.push(key);
      }
    }

    // Cleanup expired workers
    for (const key of expiredKeys) {
      const cached = this.workers.get(key);
      if (cached) {
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Cleaning up expired OCR worker: ${key}`);
        try {
          await cached.worker.terminate();
        } catch (e) {
          console.warn(`⚠️ Error terminating worker ${key}:`, e);
        }
        this.workers.delete(key);
      }
    }

    // If cache is too large, remove least recently used
    if (this.workers.size > CACHE_CONFIGURATION.maxCachedWorkers) {
      const sortedEntries = Array.from(this.workers.entries())
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

      const toRemove = sortedEntries.slice(0, this.workers.size - CACHE_CONFIGURATION.maxCachedWorkers);
      for (const [key, cached] of toRemove) {
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Removing LRU OCR worker: ${key}`);
        try {
          await cached.worker.terminate();
        } catch (e) {
          console.warn(`⚠️ Error terminating worker ${key}:`, e);
        }
        this.workers.delete(key);
      }
    }
  }

  /**
   * OPTIMIZED: Smart worker initialization with reuse and progressive enhancement
   * @param languages Languages to load in the worker
   * @param onProgress Optional callback for real-time progress updates
   */
  public static async initializeWorker(languages: OCRLanguage[], onProgress?: OCRProgressCallback): Promise<Tesseract.Worker> {
    const workerKey = this.getWorkerKey(languages);

    // Check cache first with worker validation
    if (this.workers.has(workerKey)) {
      const cached = this.workers.get(workerKey)!;
      
      // CRITICAL FIX: Validate worker is still functional before reuse
      try {
        const worker = cached.worker;
        if (worker && typeof worker.recognize === 'function') {
          cached.lastUsed = Date.now();
          cached.useCount++;
          console.log(`🎯 CACHE HIT: Reusing validated worker for ${workerKey} (used ${cached.useCount} times)`);
          return worker;
        } else {
          console.warn(`⚠️ Cached worker for ${workerKey} is invalid, removing from cache`);
          this.workers.delete(workerKey); // Clear invalid cache
        }
      } catch (error) {
        console.warn(`⚠️ Error validating cached worker for ${workerKey}:`, error);
        this.workers.delete(workerKey); // Clear problematic cache
      }
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(workerKey)) {
      console.log(`⏳ Waiting for existing worker creation: ${workerKey}`);
      return this.loadingPromises.get(workerKey)!;
    }

    // OPTIMIZATION: Start with fastest possible worker, enhance later
    console.log(`🔄 CACHE MISS: Creating optimized worker for languages: ${workerKey}`);
    
    // Use progressive creation strategy
    const loadingPromise = this.createProgressiveWorker(languages, onProgress);
    this.loadingPromises.set(workerKey, loadingPromise);

    try {
      const worker = await loadingPromise;

      // Cache the worker
      this.workers.set(workerKey, {
        worker,
        lastUsed: Date.now(),
        useCount: 1,
        languages: languages
      });

      this.loadingPromises.delete(workerKey);
      this.startCleanupTimer();

      console.log(`✅ Optimized worker cached for ${workerKey}`);
      return worker;
    } catch (error) {
      this.loadingPromises.delete(workerKey);
      throw error;
    }
  }

  /**
   * Create worker using progressive enhancement strategy
   */
  private static async createProgressiveWorker(
    languages: OCRLanguage[], 
    onProgress?: OCRProgressCallback
  ): Promise<Tesseract.Worker> {
    // If only English requested, create fast worker
    if (languages.length === 1 && languages[0] === 'eng') {
      console.log('⚡ Creating fast English-only worker');
      return OCRWorkerFactory.createWorker({
        languages,
        deployment: 'auto',
        performanceMode: 'FAST',
        timeout: 10000,
        onProgress
      });
    }
    
    // If multiple languages including English, start with English then enhance
    if (languages.includes('eng')) {
      console.log('⚡ Creating English-first worker, will enhance with additional languages');
      
      // Start with English for immediate functionality
      const fastWorker = await OCRWorkerFactory.createWorker({
        languages: ['eng'],
        deployment: 'auto',
        performanceMode: 'FAST',
        timeout: 10000,
        onProgress: (progress) => {
          if (onProgress) onProgress(progress * 0.5); // First half of progress
        }
      });
      
      // If other languages requested, create full worker and replace
      if (languages.length > 1) {
        try {
          console.log('🔄 Enhancing worker with full language set:', languages);
          const fullWorker = await OCRWorkerFactory.createWorker({
            languages,
            deployment: 'auto',
            performanceMode: 'BALANCED',
            timeout: 20000,
            onProgress: (progress) => {
              if (onProgress) onProgress(0.5 + (progress * 0.5)); // Second half of progress
            }
          });
          
          // Terminate fast worker and return full worker
          await fastWorker.terminate();
          console.log('✅ Enhanced worker with full language set');
          return fullWorker;
        } catch (error) {
          console.warn('⚠️ Enhancement failed, using fast English worker:', error);
          return fastWorker;
        }
      }
      
      return fastWorker;
    }
    
    // For non-English languages, use standard creation
    return OCRWorkerFactory.createWorker({
      languages,
      deployment: 'auto',
      performanceMode: 'BALANCED',
      timeout: 25000,
      onProgress
    });
  }

  /**
   * Gets cache statistics for monitoring
   */
  public static getCacheStats(): CacheStats {
    return {
      cachedWorkers: this.workers.size,
      detectionWorkerCached: false,
      totalCacheHits: Array.from(this.workers.values()).reduce((sum, cached) => sum + cached.useCount, 0),
      oldestWorker: this.workers.size > 0 ? Math.min(...Array.from(this.workers.values()).map(cached => cached.lastUsed)) : Infinity,
      newestWorker: this.workers.size > 0 ? Math.max(...Array.from(this.workers.values()).map(cached => cached.lastUsed)) : -Infinity,
      // Language detection cache stats
      languageCacheSize: 0,
      languageCacheHits: 0,
      oldestLanguageCache: Infinity,
      newestLanguageCache: -Infinity
    };
  }

  /**
   * Enhanced cleanup with memory pressure detection
   */
  private static async performCleanup(): Promise<void> {
    // Clean up expired workers and manage cache size
    await this.cleanupExpiredWorkers();
  }

  /**
   * Terminates all workers and clears caches
   */
  public static async terminate(): Promise<void> {
    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Terminate all workers
    const terminationPromises = Array.from(this.workers.values()).map(cached => cached.worker.terminate());

    await Promise.all(terminationPromises);

    this.workers.clear();
    this.loadingPromises.clear();

    if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 All OCR workers terminated and caches cleared');
  }
}

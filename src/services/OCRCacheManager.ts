/**
 * OCR Cache Manager - PRODUCTION FIX VERSION
 * 
 * Handles caching of Tesseract workers and language detection results
 * to optimize performance and resource utilization.
 * 
 * FIXES:
 * - Progressive language loading for production builds
 * - Timeout handling for worker initialization
 * - Graceful fallback to English-only OCR
 */

import { createWorker } from 'tesseract.js';
import {
  CachedWorker,
  LanguageDetectionCacheEntry,
  OCRLanguage,
  CacheStats,
  OCRProgressCallback
} from '../types/ocr-types';
import { CACHE_CONFIGURATION, DETECTION_LANGUAGES } from '../config/ocrConfig';
import { DEV_CONFIG } from '../config/appConfig';
import { getTesseractConfig, getResourcePaths } from '../config/pathConfig';
import { OCRErrorHandler, OCRErrorDetection, OCRError, OCRErrorUtils } from '../utils/ocrErrorHandling';
import { getTesseractPerformanceConfig, LANGUAGE_OPTIMIZATIONS, TesseractPerformanceConfig } from '../config/tesseractConfig';

/**
 * Deployment-aware worker factory configuration
 */
export interface WorkerFactoryOptions {
  languages: OCRLanguage[];
  deployment?: 'web' | 'electron' | 'auto';
  enableOSD?: boolean;
  performanceMode?: 'FAST' | 'BALANCED' | 'ACCURATE';
  timeout?: number;
  onProgress?: OCRProgressCallback;
}

/**
 * Unified OCR Worker Factory for deployment-focused architecture
 */
export class OCRWorkerFactory {
  /**
   * Create worker using deployment-aware factory method
   * This is the new unified entry point for all worker creation
   */
  static async createWorker(options: WorkerFactoryOptions): Promise<Tesseract.Worker> {
    const {
      languages,
      deployment = 'auto',
      enableOSD = false,
      performanceMode = 'BALANCED',
      timeout = 15000,
      onProgress
    } = options;

    console.log('🏭 OCRWorkerFactory.createWorker called with:', {
      languages,
      deployment,
      enableOSD,
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
          return enableOSD 
            ? await this.createWebWorkerWithOSD(languages, timeout, onProgress, performanceMode)
            : await this.createWebWorker(languages, timeout, onProgress, performanceMode);
            
        case 'electron':
          return enableOSD
            ? await this.createElectronWorkerWithOSD(languages, timeout, onProgress, performanceMode) 
            : await this.createElectronWorker(languages, timeout, onProgress, performanceMode);
            
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
        // OSD detection requires Legacy engine support - use OEM 2 (Legacy + LSTM)
        const ocrEngineMode = languages.includes('osd') ? 2 : (finalConfig.tesseract_ocr_engine_mode || 3);
        const { tessedit_ocr_engine_mode, ...parametersForLater } = finalConfig;

        // Web workers still need langPath for OSD data
        const resourcePaths = await getResourcePaths();
        const finalLangPath = resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/';
        
        console.log('🔍 DEBUG - Web worker paths:', {
          resourcePaths,
          finalLangPath,
          languages,
          ocrEngineMode: ocrEngineMode,
          isOSDWorker: languages.includes('osd')
        });
        
        const workerOptions = {
          logger: OCRCacheManager.createLogger(onProgress),
          langPath: finalLangPath,
          legacyCore: true,
          legacyLang: true
        };

        const worker = await Promise.race([
          createWorker(languages, ocrEngineMode, workerOptions),
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
        // OSD detection requires Legacy engine support - use OEM 2 (Legacy + LSTM)
        const ocrEngineMode = languages.includes('osd') ? 2 : (finalConfig.tesseract_ocr_engine_mode || 3);
        const { tessedit_ocr_engine_mode, ...parametersForLater } = finalConfig;

        const finalLangPath = resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/';
        
        console.log('🔍 DEBUG - Electron worker paths:', {
          resourcePaths,
          finalLangPath,
          languages,
          ocrEngineMode: ocrEngineMode,
          isOSDWorker: languages.includes('osd')
        });

        const workerOptions = {
          logger: OCRCacheManager.createLogger(onProgress),
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          langPath: finalLangPath,
          legacyCore: true,
          legacyLang: true
        };

        const worker = await Promise.race([
          createWorker(languages, ocrEngineMode, workerOptions),
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
   * Create web worker with OSD support
   */
  static async createWebWorkerWithOSD(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🌐🔍 Creating web worker with OSD support for languages:', languages);
    return this.createWebWorker(languages, timeout, onProgress, useCase);
  }

  /**
   * Create electron worker with OSD support  
   */
  static async createElectronWorkerWithOSD(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('⚡🔍 Creating electron worker with OSD support for languages:', languages);
    return this.createElectronWorker(languages, timeout, onProgress, useCase);
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

export class OCRCacheManager {
  // PERFORMANCE CONSTANTS
  private static readonly FAST_INIT_TIMEOUT = 8000; // 8 seconds for fast initialization
  private static readonly ENHANCED_INIT_TIMEOUT = 15000; // 15 seconds for enhanced initialization
  private static readonly FALLBACK_TIMEOUT = 10000; // 10 seconds for fallback
  private static readonly CACHE_EXPIRY = CACHE_CONFIGURATION.cacheExpiryMs; // Cache expiry time
  private static workers: Map<string, CachedWorker> = new Map();
  private static loadingPromises: Map<string, Promise<Tesseract.Worker>> = new Map();
  private static detectionWorker: CachedWorker | null = null;

  // Language detection cache
  private static languageCache: Map<string, LanguageDetectionCacheEntry> = new Map();

  // Cleanup timer
  private static cleanupTimer: NodeJS.Timeout | null = null;

  // OPTIMIZATION: Language loading strategy cache
  private static languageLoadingStrategy: Map<string, OCRLanguage[]> = new Map();
  private static initializationStartTime = Date.now();

  // Environment detection and path resolution moved to centralized pathConfig service

  /**
   * Create worker using centralized path configuration
   */
  /**
   * @deprecated Use OCRWorkerFactory.createWorker() instead
   * Legacy method maintained for backward compatibility
   */
  public static async createWorkerWithFallback(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🔧 [DEPRECATED] createWorkerWithFallback - Use OCRWorkerFactory.createWorker() instead');
    
    return OCRWorkerFactory.createWorker({
      languages,
      deployment: 'auto',
      enableOSD: false,
      performanceMode: useCase,
      timeout,
      onProgress
    });
  }

  /**
   * @deprecated Use OCRWorkerFactory.createWorker() with deployment: 'web' instead
   * Legacy method maintained for backward compatibility
   */
  public static async createCDNWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🌐 [DEPRECATED] createCDNWorker - Use OCRWorkerFactory.createWorker() instead');
    
    return OCRWorkerFactory.createWorker({
      languages,
      deployment: 'web',
      enableOSD: false,
      performanceMode: useCase,
      timeout,
      onProgress
    });
  }


  /**
   * @deprecated Use OCRWorkerFactory.createWorker() with enableOSD: true instead
   * Legacy method maintained for backward compatibility
   */
  public static async createWorkerWithOSDSupport(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🔧 [DEPRECATED] createWorkerWithOSDSupport - Use OCRWorkerFactory.createWorker() instead');
    
    return OCRWorkerFactory.createWorker({
      languages,
      deployment: 'auto',
      enableOSD: true,
      performanceMode: useCase,
      timeout,
      onProgress
    });
  }

  /**
   * @deprecated Use OCRWorkerFactory.createWorker() with deployment: 'web', enableOSD: true instead
   * Legacy method maintained for backward compatibility
   */
  public static async createCDNWorkerWithOSD(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🌐 [DEPRECATED] createCDNWorkerWithOSD - Use OCRWorkerFactory.createWorker() instead');
    
    return OCRWorkerFactory.createWorker({
      languages,
      deployment: 'web',
      enableOSD: true,
      performanceMode: useCase,
      timeout,
      onProgress
    });
  }

  /**
   * PRIORITY FIX: Reorders detection languages to prioritize English over Russian
   * This helps prevent false positives where English text is detected as Russian
   */
  private static getPrioritizedDetectionLanguages(languages: OCRLanguage[]): OCRLanguage[] {
    // Define priority order: English first, then other Latin scripts, then non-Latin scripts, Russian last
    const priorityOrder: OCRLanguage[] = [
      'eng',        // English - highest priority
      'spa',        // Spanish
      'fra',        // French  
      'deu',        // German
      'chi_sim',    // Chinese Simplified
      'chi_tra',    // Chinese Traditional
      'jpn',        // Japanese
      'kor',        // Korean
      'ara',        // Arabic
      'rus'         // Russian - lowest priority to prevent false positives
    ];

    // Reorder the languages according to priority
    const prioritized: OCRLanguage[] = [];
    const remaining = [...languages];

    // Add languages in priority order
    for (const lang of priorityOrder) {
      const index = remaining.indexOf(lang);
      if (index !== -1) {
        prioritized.push(lang);
        remaining.splice(index, 1);
      }
    }

    // Add any remaining languages that weren't in the priority list
    prioritized.push(...remaining);

    console.log('🎯 Language detection priority order:', prioritized);
    return prioritized;
  }

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
        await cached.worker.terminate();
        this.workers.delete(key);
      }
    }

    // Cleanup detection worker if expired
    if (this.detectionWorker && now - this.detectionWorker.lastUsed > CACHE_CONFIGURATION.cacheExpiryMs) {
      if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 Cleaning up expired detection worker');
      await this.detectionWorker.worker.terminate();
      this.detectionWorker = null;
    }

    // If cache is too large, remove least recently used
    if (this.workers.size > CACHE_CONFIGURATION.maxCachedWorkers) {
      const sortedEntries = Array.from(this.workers.entries())
        .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);

      const toRemove = sortedEntries.slice(0, this.workers.size - CACHE_CONFIGURATION.maxCachedWorkers);
      for (const [key, cached] of toRemove) {
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Removing LRU OCR worker: ${key}`);
        await cached.worker.terminate();
        this.workers.delete(key);
      }
    }
  }

  /**
   * Cleans up expired language detection cache entries
   */
  private static cleanupLanguageCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired language cache entries
    for (const [key, entry] of this.languageCache.entries()) {
      if (now - entry.timestamp > CACHE_CONFIGURATION.languageCacheExpiryMs) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.languageCache.delete(key);
      if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Cleaned up expired language detection cache entry`);
    }

    // If cache is too large, remove least recently used
    if (this.languageCache.size > CACHE_CONFIGURATION.maxLanguageCacheEntries) {
      const sortedEntries = Array.from(this.languageCache.entries())
        .sort(([, a], [, b]) => {
          // Sort by hit count first, then by timestamp
          if (a.hitCount !== b.hitCount) {
            return a.hitCount - b.hitCount;
          }
          return a.timestamp - b.timestamp;
        });

      const toRemove = sortedEntries.slice(0, this.languageCache.size - CACHE_CONFIGURATION.maxLanguageCacheEntries);
      for (const [key] of toRemove) {
        this.languageCache.delete(key);
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Removed LRU language detection cache entry`);
      }
    }
  }

  /**
   * Generates a cache key for language detection
   */
  public static async generateLanguageCacheKey(imageFile: File | Blob): Promise<string> {
    const size = imageFile.size;

    if (imageFile instanceof File) {
      // For File objects: use size + modified date + name
      const modifiedDate = imageFile.lastModified || 0;
      const name = imageFile.name || 'unknown';
      return `file_${size}_${modifiedDate}_${name}`;
    } else {
      // For Blob objects: use size + content hash
      const arrayBuffer = await imageFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16); // First 16 chars
      return `blob_${size}_${hashHex}`;
    }
  }

  /**
   * Checks language detection cache for existing results
   */
  public static async checkLanguageCache(imageFile: File | Blob): Promise<OCRLanguage[] | null> {
    try {
      const cacheKey = await this.generateLanguageCacheKey(imageFile);
      const cached = this.languageCache.get(cacheKey);

      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < CACHE_CONFIGURATION.languageCacheExpiryMs) {
          // Update hit count and return cached result
          cached.hitCount++;
          console.log(`🎯 LANGUAGE CACHE HIT: Found cached detection result (hit #${cached.hitCount}):`, cached.languages);
          return cached.languages;
        } else {
          // Expired entry
          this.languageCache.delete(cacheKey);
          console.log(`⏰ Language cache entry expired, removing`);
        }
      }

      console.log(`🔍 LANGUAGE CACHE MISS: No cached detection result found`);
      return null;
    } catch (error) {
      console.warn('Failed to check language cache:', error);
      return null;
    }
  }

  /**
   * Stores language detection result in cache
   */
  public static async storeLanguageCache(imageFile: File | Blob, languages: OCRLanguage[]): Promise<void> {
    try {
      const cacheKey = await this.generateLanguageCacheKey(imageFile);

      this.languageCache.set(cacheKey, {
        languages: [...languages], // Clone array
        timestamp: Date.now(),
        hitCount: 0
      });

      console.log(`💾 LANGUAGE CACHE STORE: Cached detection result for future use:`, languages);

      // Trigger cleanup if cache is getting large
      if (this.languageCache.size > CACHE_CONFIGURATION.maxLanguageCacheEntries) {
        this.cleanupLanguageCache();
      }
    } catch (error) {
      console.warn('Failed to store language cache:', error);
    }
  }

  /**
   * OPTIMIZED: Fast detection worker initialization with smart language loading
   * 
   * Strategy:
   * 1. English-only worker first (fastest: <3 seconds)
   * 2. Lazy load additional languages only when needed
   * 3. Progressive enhancement without blocking initial OCR
   */
  public static async initializeDetectionWorker(onProgress?: OCRProgressCallback): Promise<Tesseract.Worker> {
    // Check cache first with worker validation
    if (this.detectionWorker) {
      // CRITICAL FIX: Validate worker is still functional before reuse
      try {
        const worker = this.detectionWorker.worker;
        // Test if worker is still alive by checking if it has expected methods
        if (worker && typeof worker.detect === 'function' && typeof worker.recognize === 'function') {
          this.detectionWorker.lastUsed = Date.now();
          this.detectionWorker.useCount++;
          console.log(`🎯 DETECTION CACHE HIT: Reusing validated detection worker (used ${this.detectionWorker.useCount} times)`);
          return worker;
        } else {
          console.warn('⚠️ Cached detection worker is invalid, creating new one');
          this.detectionWorker = null; // Clear invalid cache
        }
      } catch (error) {
        console.warn('⚠️ Error validating cached detection worker:', error);
        this.detectionWorker = null; // Clear problematic cache
      }
    }

    console.log('🔄 DETECTION CACHE MISS: Creating OSD-enabled detection worker...');

    // Report progress for worker initialization
    if (onProgress) {
      onProgress(0.1); // 10% - Starting worker creation
    }

    try {
      // Add OSD language back for detection
      const detectionLanguages: OCRLanguage[] = ['eng', 'osd'];
      console.log('⚡ Creating OSD-enabled detection worker with English + OSD language support');
      
      if (onProgress) {
        onProgress(0.3); // 30% - Creating worker
      }
      
      // CRITICAL: Create worker with legacy support for OSD detection
      const worker = await OCRWorkerFactory.createWorker({
        languages: detectionLanguages,
        deployment: 'auto',
        enableOSD: true,
        performanceMode: 'BALANCED',
        timeout: 15000,
        onProgress: (progress) => {
          // Scale progress from 30% to 80% during worker creation
          if (onProgress) {
            onProgress(0.3 + (progress * 0.5));
          }
        }
      });

      if (onProgress) {
        onProgress(0.8); // 80% - Worker created, caching
      }

      // Cache the OSD-enabled worker
      this.detectionWorker = {
        worker,
        lastUsed: Date.now(),
        useCount: 1,
        languages: detectionLanguages
      };

      this.startCleanupTimer();
      
      if (onProgress) {
        onProgress(1.0); // 100% - Complete
      }
      
      console.log('✅ OSD-enabled detection worker created and cached');

      // CRITICAL FIX: Disabled background enhancement to prevent race conditions
      // Background enhancement was terminating active workers causing postMessage errors
      // this.enhanceDetectionWorkerAsync()
      //   .then(() => console.log('🌍 Background language enhancement completed'))
      //   .catch(error => console.warn('⚠️ Background enhancement failed (non-critical):', error));

      return worker;

    } catch (error) {
      console.error('❌ OSD detection worker creation failed:', error);
      
      // Final fallback with CDN and legacy support
      if (onProgress) {
        onProgress(0.5); // 50% - Trying CDN fallback
      }
      
      try {
        const worker = await OCRWorkerFactory.createWorker({
          languages: ['eng', 'osd'],
          deployment: 'web',
          enableOSD: true,
          performanceMode: 'FAST',
          timeout: 15000,
          onProgress
        });
        
        this.detectionWorker = {
          worker,
          lastUsed: Date.now(),
          useCount: 1,
          languages: ['eng', 'osd']
        };
        
        console.log('✅ CDN fallback OSD worker created');
        return worker;
      } catch (cdnError) {
        console.error('❌ All OSD detection worker creation attempts failed');
        throw new Error(`OSD detection worker initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * ASYNC ENHANCEMENT: Load additional languages in background without blocking
   */
  private static async enhanceDetectionWorkerAsync(): Promise<void> {
    // Wait a bit to let the main OCR operation start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      console.log('🌍 Starting background enhancement with additional languages...');
      
      // Load core additional languages progressively
      const additionalLanguages: OCRLanguage[] = ['chi_sim', 'spa'];
      
      // Create enhanced worker with more languages
      const enhancedWorker = await OCRWorkerFactory.createWorker({
        languages: ['eng', ...additionalLanguages],
        deployment: 'auto', 
        enableOSD: false,
        performanceMode: 'BALANCED',
        timeout: 20000
      });
      
      // Terminate old worker and replace with enhanced one
      if (this.detectionWorker) {
        await this.detectionWorker.worker.terminate();
        
        this.detectionWorker = {
          worker: enhancedWorker,
          lastUsed: Date.now(),
          useCount: this.detectionWorker.useCount,
          languages: ['eng', ...additionalLanguages]
        };
        
        console.log('✅ Detection worker enhanced with additional languages:', additionalLanguages);
      }
    } catch (error) {
      console.warn('⚠️ Background enhancement failed, keeping fast worker:', error);
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
          console.log(`🎯 EXTRACTION CACHE HIT: Reusing validated worker for ${workerKey} (used ${cached.useCount} times)`);
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

    // OPTIMIZATION: Check if detection worker can be reused for compatible languages
    if (this.canReuseDetectionWorker(languages)) {
      console.log('⚡ SMART REUSE: Using detection worker for extraction to avoid duplicate initialization');
      const detectionWorker = this.detectionWorker!.worker;
      
      // Cache this reuse for future requests
      this.workers.set(workerKey, {
        worker: detectionWorker,
        lastUsed: Date.now(),
        useCount: 1,
        languages: languages,
        isShared: true // Mark as shared to prevent termination
      });
      
      return detectionWorker;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(workerKey)) {
      console.log(`⏳ Waiting for existing worker creation: ${workerKey}`);
      return this.loadingPromises.get(workerKey)!;
    }

    // OPTIMIZATION: Start with fastest possible worker, enhance later
    console.log(`🔄 EXTRACTION CACHE MISS: Creating optimized worker for languages: ${workerKey}`);
    
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

      console.log(`✅ Optimized extraction worker cached for ${workerKey}`);
      return worker;
    } catch (error) {
      this.loadingPromises.delete(workerKey);
      throw error;
    }
  }

  /**
   * Check if detection worker can be reused for extraction
   */
  private static canReuseDetectionWorker(requestedLanguages: OCRLanguage[]): boolean {
    if (!this.detectionWorker) return false;
    
    // CRITICAL FIX: Validate detection worker is still functional
    try {
      const worker = this.detectionWorker.worker;
      if (!worker || typeof worker.recognize !== 'function' || typeof worker.detect !== 'function') {
        console.warn('⚠️ Detection worker is invalid, cannot reuse');
        this.detectionWorker = null; // Clear invalid worker
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error validating detection worker for reuse:', error);
      this.detectionWorker = null; // Clear problematic worker
      return false;
    }
    
    const detectionLanguages = this.detectionWorker.languages;
    
    // Can reuse if requested languages are subset of detection worker languages
    return requestedLanguages.every(lang => detectionLanguages.includes(lang));
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
        enableOSD: false,
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
        enableOSD: false,
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
            enableOSD: false,
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
      enableOSD: false,
      performanceMode: 'BALANCED',
      timeout: 25000,
      onProgress
    });
  }

  /**
   * Gets cached worker by key (used for cache hit detection)
   */
  public static getCachedWorker(workerKey: string): CachedWorker | null {
    return this.workers.get(workerKey) || null;
  }

  /**
   * Gets cache statistics for monitoring
   */
  public static getCacheStats(): CacheStats {
    return {
      cachedWorkers: this.workers.size,
      detectionWorkerCached: !!this.detectionWorker,
      totalCacheHits: Array.from(this.workers.values()).reduce((sum, cached) => sum + cached.useCount, 0) +
        (this.detectionWorker?.useCount || 0),
      oldestWorker: this.workers.size > 0 ? Math.min(...Array.from(this.workers.values()).map(cached => cached.lastUsed)) : Infinity,
      newestWorker: this.workers.size > 0 ? Math.max(...Array.from(this.workers.values()).map(cached => cached.lastUsed)) : -Infinity,
      // Language detection cache stats
      languageCacheSize: this.languageCache.size,
      languageCacheHits: Array.from(this.languageCache.values()).reduce((sum, entry) => sum + entry.hitCount, 0),
      oldestLanguageCache: this.languageCache.size > 0 ? Math.min(...Array.from(this.languageCache.values()).map(entry => entry.timestamp)) : Infinity,
      newestLanguageCache: this.languageCache.size > 0 ? Math.max(...Array.from(this.languageCache.values()).map(entry => entry.timestamp)) : -Infinity
    };
  }

  /**
   * Memory pressure detection and LRU worker eviction
   */
  private static memoryPressureThreshold = 0.8; // 80% of available memory
  private static lastMemoryCheck = 0;
  private static memoryCheckInterval = 5000; // 5 seconds

  /**
   * Check if system is under memory pressure
   */
  private static checkMemoryPressure(): boolean {
    if (typeof window === 'undefined' || !window.performance || !window.performance.memory) {
      return false; // Cannot detect memory pressure in this environment
    }

    const now = Date.now();
    if (now - this.lastMemoryCheck < this.memoryCheckInterval) {
      return false; // Don't check too frequently
    }

    this.lastMemoryCheck = now;
    
    try {
      const memory = window.performance.memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.jsHeapSizeLimit;
      const memoryUsageRatio = usedMemory / totalMemory;
      
      const isUnderPressure = memoryUsageRatio > this.memoryPressureThreshold;
      
      if (isUnderPressure) {
        console.warn(`⚠️ Memory pressure detected: ${(memoryUsageRatio * 100).toFixed(1)}% used (${(usedMemory / 1024 / 1024).toFixed(1)}MB)`);
      }
      
      return isUnderPressure;
    } catch (error) {
      console.warn('⚠️ Error checking memory pressure:', error);
      return false;
    }
  }

  /**
   * Evict least recently used workers when under memory pressure
   */
  private static async evictLRUWorkers(): Promise<void> {
    if (this.workers.size <= 1) return; // Keep at least one worker

    const workersArray = Array.from(this.workers.entries());
    
    // Sort by last used time (oldest first)
    workersArray.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
    
    // Calculate how many to evict (keep 50% or at least 1)
    const targetSize = Math.max(1, Math.floor(this.workers.size / 2));
    const toEvict = workersArray.slice(0, this.workers.size - targetSize);
    
    console.log(`🧹 Memory pressure: Evicting ${toEvict.length} LRU workers, keeping ${targetSize}`);
    
    const evictionPromises = toEvict.map(async ([key, cached]) => {
      if (cached.isShared) return; // Don't evict shared workers
      
      try {
        await cached.worker.terminate();
        this.workers.delete(key);
        console.log(`🗑️ Evicted worker: ${key}`);
      } catch (error) {
        console.warn(`⚠️ Error terminating worker ${key}:`, error);
      }
    });

    await Promise.all(evictionPromises);
  }

  /**
   * EMERGENCY: Force clear all cached workers (especially detection worker)
   * Use this when workers were created with wrong configuration
   */
  public static async forceClearAllWorkers(): Promise<void> {
    console.log('🚨 FORCE CLEARING all cached workers due to configuration change');
    
    // Terminate detection worker first
    if (this.detectionWorker) {
      try {
        await this.detectionWorker.worker.terminate();
        console.log('✅ Detection worker terminated');
      } catch (error) {
        console.warn('⚠️ Failed to terminate detection worker:', error);
      }
      this.detectionWorker = null;
    }
    
    // Terminate all other cached workers
    const terminationPromises = Array.from(this.workers.values()).map(async (cached) => {
      try {
        await cached.worker.terminate();
        console.log(`✅ Worker for ${cached.languages.join(',')} terminated`);
      } catch (error) {
        console.warn(`⚠️ Failed to terminate worker:`, error);
      }
    });
    
    await Promise.all(terminationPromises);
    
    // Clear all caches
    this.workers.clear();
    this.languageCache.clear();
    
    console.log('🧹 All workers and caches forcefully cleared');
  }

  /**
   * Enhanced cleanup with memory pressure detection
   */
  private static async performCleanup(): Promise<void> {
    const now = Date.now();
    
    // Check memory pressure before cleanup
    const isUnderMemoryPressure = this.checkMemoryPressure();
    if (isUnderMemoryPressure) {
      await this.evictLRUWorkers();
    }

    // Existing cleanup logic
    const expiredWorkers: string[] = [];
    
    for (const [key, cached] of this.workers) {
      if (now - cached.lastUsed > this.CACHE_EXPIRY) {
        if (!cached.isShared) { // Don't evict shared workers
          expiredWorkers.push(key);
        }
      }
    }

    const cleanupPromises = expiredWorkers.map(async (key) => {
      const cached = this.workers.get(key)!;
      try {
        await cached.worker.terminate();
        this.workers.delete(key);
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) {
          console.log(`🧹 Cleaned up expired worker: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error terminating worker ${key}:`, error);
      }
    });

    await Promise.all(cleanupPromises);

    // Clean up language detection cache
    const expiredLanguages: string[] = [];
    for (const [key, cached] of this.languageCache) {
      if (now - cached.timestamp > this.CACHE_EXPIRY) {
        expiredLanguages.push(key);
      }
    }

    expiredLanguages.forEach(key => this.languageCache.delete(key));

    if (cleanupPromises.length > 0 || expiredLanguages.length > 0) {
      console.log(`🧹 Cleanup complete: ${cleanupPromises.length} workers, ${expiredLanguages.length} language caches`);
    }
  }

  /**
   * Get memory usage statistics
   */
  public static getMemoryStats(): {
    memoryPressure: boolean;
    memoryUsage: number | null;
    memoryLimit: number | null;
    workersCount: number;
    totalWorkers: number;
  } {
    let memoryUsage = null;
    let memoryLimit = null;
    
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      memoryUsage = memory.usedJSHeapSize;
      memoryLimit = memory.jsHeapSizeLimit;
    }

    return {
      memoryPressure: this.checkMemoryPressure(),
      memoryUsage,
      memoryLimit,
      workersCount: this.workers.size,
      totalWorkers: this.workers.size + (this.detectionWorker ? 1 : 0)
    };
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

    if (this.detectionWorker) {
      terminationPromises.push(this.detectionWorker.worker.terminate());
    }

    await Promise.all(terminationPromises);

    this.workers.clear();
    this.loadingPromises.clear();
    this.detectionWorker = null;

    // Clear language detection cache
    this.languageCache.clear();

    if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 All OCR workers terminated and caches cleared');
  }
}
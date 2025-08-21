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
import { CACHE_CONFIGURATION } from '../config/ocrConfig';
import { DEV_CONFIG } from '../config/appConfig';
import { getResourcePaths } from '../config/pathConfig';
import { getTesseractPerformanceConfig, LANGUAGE_OPTIMIZATIONS, TesseractPerformanceConfig } from '../config/tesseractConfig';
import { OCRErrorDetection, OCRErrorHandler, OCRErrorUtils } from '../utils/ocrErrorHandling';

export class OCRCacheManager {
  // PERFORMANCE CONSTANTS
  private static readonly FAST_INIT_TIMEOUT = 8000; // 8 seconds for fast initialization
  private static readonly ENHANCED_INIT_TIMEOUT = 15000; // 15 seconds for enhanced initialization
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
   * CONSOLIDATED: Builds common worker options configuration
   */
  private static async buildWorkerOptions(
    onProgress?: OCRProgressCallback,
    useCDN: boolean = false,
    tauriConfig?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const baseOptions = {
      logger: this.createLogger(onProgress),
      // ESSENTIAL: Enable legacy core and language support for OSD detection
      legacyCore: true,
      legacyLang: true
    };

    if (useCDN) {
      // CDN worker uses default paths
      return baseOptions;
    }

    if (tauriConfig) {
      // Tauri-specific configuration
      return {
        ...baseOptions,
        ...tauriConfig
      };
    }

    // Standard worker with centralized resource paths
    const resourcePaths = await getResourcePaths();
    console.log('🔧 Using centralized resource paths:', resourcePaths);

    return {
      ...baseOptions,
      workerPath: resourcePaths.workerPath,
      corePath: resourcePaths.corePath,
    };
  }

  /**
        langPath: resourcePaths.langPath
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED',
    useCDN: boolean = false,
    tauriConfig?: Record<string, unknown>,
    workerType: string = 'standard'
      console.log(`🔧 Creating worker with OCR engine mode: ${ocrEngineMode} (3=LSTM+Legacy for OSD support)`);
    console.log(`🔧 createWorkerCore called with languages: ${languages}, useCase: ${useCase}, type: ${workerType}`);

    // Get performance-optimized configuration
    const perfConfig = getTesseractPerformanceConfig(useCase);
    
    // Apply language-specific optimizations
    let languageConfig: Partial<TesseractPerformanceConfig> = {};
    for (const lang of languages) {
      if (LANGUAGE_OPTIMIZATIONS[lang]) {
        languageConfig = { ...languageConfig, ...LANGUAGE_OPTIMIZATIONS[lang] };
      }
    }

      console.log('✅ Worker created successfully with performance parameters:', finalConfig);
    const finalConfig = { ...perfConfig, ...languageConfig };
    
    // Extract OCR engine mode for worker creation (must be set during initialization)
    const ocrEngineMode = finalConfig.tessedit_ocr_engine_mode || 3; // Default to 3 (LSTM + legacy) for OSD support
    
    // Remove engine mode from parameters that will be set later (to avoid the error)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tessedit_ocr_engine_mode, ...parametersForLater } = finalConfig;

    // Build worker options using consolidated helper
    const workerOptions = await this.buildWorkerOptions(onProgress, useCDN, tauriConfig);

    // Calculate optimized timeout
    const optimizedTimeout = languages.length === 1 ? 
      Math.min(timeout, this.FAST_INIT_TIMEOUT) : 
      Math.min(timeout, this.ENHANCED_INIT_TIMEOUT);

    console.log(`🔧 Creating ${workerType} worker with OCR engine mode: ${ocrEngineMode} and legacy support enabled`);

    const worker = await Promise.race([
      createWorker(languages, ocrEngineMode, workerOptions),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${workerType} Worker timeout`)), optimizedTimeout)
      )
    ]);

    // Apply remaining performance parameters after worker creation (excluding engine mode)
    if (Object.keys(parametersForLater).length > 0) {
      await worker.setParameters(parametersForLater);
    }
    
    console.log(`✅ ${workerType} worker created successfully with legacy support and performance parameters:`, finalConfig);
    return worker;
  }

  /**
   * Create worker using centralized path configuration
   */
  private static async createWorkerWithFallback(
    languages: OCRLanguage[],
    timeout: number,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
        logger: this.createLogger(onProgress)
    try {
      
      // Fallback to CDN for reliability
      console.log(`🌐 Creating CDN worker with OCR engine mode: ${ocrEngineMode} (3=LSTM+Legacy for OSD support)`);
    }
  }

  /**
   * Create worker using CDN as fallback when local paths fail
   */
  private static async createCDNWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🌐 Creating CDN fallback worker for languages:', languages, 'useCase:', useCase);
      console.log('✅ CDN fallback worker created successfully');
    try {
      return await this.createWorkerCore(languages, timeout, onProgress, useCase, true, undefined, 'CDN');
    } catch (error) {
      console.error('❌ CDN fallback worker creation failed:', error);
      throw new Error(`All worker creation methods failed: ${error.message}`);
    }
  }

  /**
   * Create worker using centralized path configuration for Tauri environment
   */
  private static async createTauriWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🔧 Creating Tauri-optimized worker for languages:', languages, 'useCase:', useCase);

    try {
      // Get centralized Tauri configuration from pathConfig service
      const resourcePaths = await getResourcePaths();
      
      console.log('🔧 Using centralized Tauri resource paths:', resourcePaths);

      // Tauri-specific configuration using centralized paths
      const tauriConfigs = [
        {
          langPath: resourcePaths.langPath,
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath,
          // Override file location to prevent CDN access
          locateFile: (path: string, prefix: string) => {
            console.log('🔧 Tesseract locateFile called for:', path, 'prefix:', prefix);

            // Redirect all tesseract-core variants to our local version
            if (path.includes('tesseract-core') || path.includes('simd') || path.includes('lstm')) {
              console.log('🔧 Redirecting', path, 'to local core:', resourcePaths.corePath);
              return resourcePaths.corePath;
            }

            // For worker files
            if (path.includes('worker')) {
              console.log('🔧 Redirecting', path, 'to local worker:', resourcePaths.workerPath);
              return resourcePaths.workerPath;
            }

            // Default behavior for other files
            return prefix + path;
          }
        },
        // Minimal configuration with centralized paths
        {
          langPath: resourcePaths.langPath,
          workerPath: resourcePaths.workerPath,
          corePath: resourcePaths.corePath
        }
      ];

      for (let i = 0; i < tauriConfigs.length; i++) {
        const config = tauriConfigs[i];
        try {
          console.log(`🔧 Tauri attempt ${i + 1}/${tauriConfigs.length}:`, config);

          const worker = await this.createWorkerCore(
            languages, 
            timeout / 3, // Divide timeout among attempts
            onProgress, 
            useCase, 
            false, 
            config, 
            `Tauri-${i + 1}`
          );

          console.log(`✅ Tauri worker created successfully with config ${i + 1}`);
          return worker;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ Tauri config ${i + 1} failed:`, errorMessage);

          if (i === tauriConfigs.length - 1) {
            throw new Error(`All Tauri worker configurations failed. Last error: ${errorMessage}`);
          }
          continue;
        }
      }

      throw new Error('Unexpected error in Tauri worker creation');

    } catch (error) {
      console.error('❌ Tauri worker creation failed:', error);
      throw error;
    }
  }

  /**
   * Create worker with OSD (Orientation & Script Detection) support
   * This requires legacy core and language support for worker.detect() functionality
   */
  private static async createWorkerWithOSDSupport(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback,
    useCase: 'FAST' | 'BALANCED' | 'ACCURATE' | 'DOCUMENT' | 'RECEIPT' = 'BALANCED'
  ): Promise<Tesseract.Worker> {
    console.log('🔧 createWorkerWithOSDSupport called with languages:', languages, 'useCase:', useCase);

    try {
      return await this.createWorkerCore(languages, timeout, onProgress, useCase, false, undefined, 'OSD');
    } catch (error) {
      console.warn('⚠️ OSD worker creation failed, falling back to CDN:', error);
      
      // Fallback to CDN for reliability
      return this.createCDNWorkerWithOSD(languages, timeout, onProgress, useCase);
    }
  }

  /**
   * Create CDN worker with OSD support as fallback when local paths fail
   */
  private static async createCDNWorkerWithOSD(
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
      // STANDARDIZED: Validate worker using standardized error handling
      try {
        const worker = this.detectionWorker.worker;
        
        if (OCRErrorHandler.validateWorker(worker, ['detect', 'recognize'])) {
          this.detectionWorker.lastUsed = Date.now();
          this.detectionWorker.useCount++;
          console.log(`🎯 DETECTION CACHE HIT: Reusing validated detection worker (used ${this.detectionWorker.useCount} times)`);
          return worker;
        } else {
          OCRErrorHandler.logError('detection worker validation', 
            new Error('Cached detection worker is invalid'), 
            { workerType: 'detection', useCount: this.detectionWorker.useCount }
          );
          this.detectionWorker = null; // Clear invalid cache
        }
      } catch (error) {
        return OCRErrorHandler.handleWorkerValidationFailure(
          error,
          'cached detection worker validation',
          async () => {
            this.detectionWorker = null; // Clear problematic cache
            throw error; // Re-throw to continue with worker creation
          }
        );
      }
    }

    console.log('🔄 DETECTION CACHE MISS: Creating OSD-enabled detection worker...');

    // Report progress for worker initialization
    if (onProgress) {
      onProgress(0.1); // 10% - Starting worker creation
    }

    try {
      // CRITICAL FIX: Use English only, not 'osd' - OSD is enabled through legacy flags
      const detectionLanguages: OCRLanguage[] = ['eng'];
      console.log('⚡ Creating OSD-enabled detection worker with English language support');
      
      if (onProgress) {
        onProgress(0.3); // 30% - Creating worker
      }
      
      // CRITICAL: Create worker with legacy support for OSD detection
      const worker = await this.createWorkerWithOSDSupport(detectionLanguages, 15000, (progress) => {
        // Scale progress from 30% to 80% during worker creation
        if (onProgress) {
          onProgress(0.3 + (progress * 0.5));
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
        const worker = await this.createCDNWorkerWithOSD(['eng'], 15000, onProgress, 'FAST');
        
        this.detectionWorker = {
          worker,
          lastUsed: Date.now(),
          useCount: 1,
          languages: ['eng']
        };
        
        console.log('✅ CDN fallback OSD worker created');
        return worker;
      } catch {
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
      const enhancedWorker = await this.createWorkerWithFallback(
        ['eng', ...additionalLanguages], 
    // Check cache first
      );
      this.detectionWorker.lastUsed = Date.now();
      this.detectionWorker.useCount++;
      console.log(`🎯 DETECTION CACHE HIT: Reusing detection worker (used ${this.detectionWorker.useCount} times)`);
      return this.detectionWorker.worker;
  }

    console.log('🔄 DETECTION CACHE MISS: Creating fast English-first detection worker...');
   * OPTIMIZED: Smart worker initialization with reuse and progressive enhancement
   * @param languages Languages to load in the worker
   * @param onProgress Optional callback for real-time progress updates
   */
  public static async initializeWorker(languages: OCRLanguage[], onProgress?: OCRProgressCallback): Promise<Tesseract.Worker> {
    const workerKey = this.getWorkerKey(languages);

      // OPTIMIZATION: Start with English only for fastest initialization
      const fastLanguages: OCRLanguage[] = ['eng'];
      console.log('⚡ Creating fast English-only detection worker for immediate use');
      
      // STANDARDIZED: Validate worker using standardized error handling
      try {
        const worker = cached.worker;
        
      const worker = await this.createWorkerWithFallback(fastLanguages, 10000, (progress) => {
          cached.useCount++;
          console.log(`🎯 EXTRACTION CACHE HIT: Reusing validated worker for ${workerKey} (used ${cached.useCount} times)`);
          return worker;
        } else {
          OCRErrorHandler.logError('extraction worker validation', 
            new Error(`Cached worker for ${workerKey} is invalid`), 
            { workerKey, languages, useCount: cached.useCount }
          );
          this.workers.delete(workerKey); // Clear invalid cache
        }
      // Cache the fast worker
        return OCRErrorHandler.handleWorkerValidationFailure(
          error,
          `cached extraction worker validation for ${workerKey}`,
          async () => {
        languages: fastLanguages
            throw error; // Re-throw to continue with worker creation
          }
        );
      }
    }

    // OPTIMIZATION: Check if detection worker can be reused for compatible languages
    if (this.canReuseDetectionWorker(languages)) {
      console.log('✅ Fast English-only detection worker created and cached');
      const detectionWorker = this.detectionWorker!.worker;
      // ASYNC ENHANCEMENT: Start loading additional languages in background
      this.enhanceDetectionWorkerAsync()
        .then(() => console.log('🌍 Background language enhancement completed'))
        .catch(error => console.warn('⚠️ Background enhancement failed (non-critical):', error));
        useCount: 1,
        languages: languages,
        isShared: true // Mark as shared to prevent termination
      });
      console.error('❌ Fast detection worker creation failed:', error);
      return detectionWorker;
      // Final fallback with CDN

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(workerKey)) {
      console.log(`⏳ Waiting for existing worker creation: ${workerKey}`);
      return this.loadingPromises.get(workerKey)!;
        const worker = await this.createCDNWorker(['eng'], 15000, onProgress, 'FAST');

    // OPTIMIZATION: Start with fastest possible worker, enhance later
    console.log(`🔄 EXTRACTION CACHE MISS: Creating optimized worker for languages: ${workerKey}`);
    
    // Use progressive creation strategy
    const loadingPromise = this.createProgressiveWorker(languages, onProgress);
    this.loadingPromises.set(workerKey, loadingPromise);

        console.log('✅ CDN fallback detection worker created');
      const worker = await loadingPromise;

        console.error('❌ All detection worker creation attempts failed');
        throw new Error(`Detection worker initialization failed: ${error.message}`);
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
    
    // STANDARDIZED: Validate detection worker using standardized error handling
    try {
      const worker = this.detectionWorker.worker;
      
      if (!OCRErrorHandler.validateWorker(worker, ['recognize', 'detect'])) {
        OCRErrorHandler.logError('detection worker reuse validation', 
          new Error('Detection worker is invalid, cannot reuse'), 
          { requestedLanguages, detectionLanguages }
        );
        this.detectionWorker = null; // Clear invalid worker
        return false;
      }
    } catch (error) {
      OCRErrorHandler.handleWorkerValidationFailure(
        error,
        'detection worker reuse validation',
        async () => {
          this.detectionWorker = null; // Clear problematic worker
          return false;
        }
      );
      return false;
    }
    
    const detectionLanguages = this.detectionWorker.languages;
    
    // Check cache first
    return requestedLanguages.every(lang => detectionLanguages.includes(lang));
  }
      cached.lastUsed = Date.now();
      cached.useCount++;
      console.log(`🎯 EXTRACTION CACHE HIT: Reusing worker for ${workerKey} (used ${cached.useCount} times)`);
      return cached.worker;
      
      // Start with English for immediate functionality
      const fastWorker = await this.createWorkerWithFallback(['eng'], 10000, (progress) => {
        if (onProgress) onProgress(progress * 0.5); // First half of progress
      });
      
      // If other languages requested, create full worker and replace
      if (languages.length > 1) {
        try {
          console.log('🔄 Enhancing worker with full language set:', languages);
          const fullWorker = await this.createWorkerWithFallback(languages, 20000, (progress) => {
            if (onProgress) onProgress(0.5 + (progress * 0.5)); // Second half of progress
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
    return this.createWorkerWithFallback(languages, 25000, onProgress);
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
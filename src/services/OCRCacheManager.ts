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

export class OCRCacheManager {
  // PERFORMANCE CONSTANTS
  private static readonly FAST_INIT_TIMEOUT = 8000; // 8 seconds for fast initialization
  private static readonly ENHANCED_INIT_TIMEOUT = 15000; // 15 seconds for enhanced initialization
  private static readonly FALLBACK_TIMEOUT = 10000; // 10 seconds for fallback
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

  /**
   * PRODUCTION FIX: Enhanced Tauri environment detection
   */
  private static async detectTauriEnvironment(): Promise<boolean> {
    // CRITICAL: Check for Electron first - it also uses file:// protocol
    if (typeof window !== 'undefined' && (window as any).isElectron) {
      // Electron environment detected, not Tauri
      return false;
    }

    // Multiple detection methods for robust Tauri identification
    const checks = [
      // Check for Tauri global object
      typeof window !== 'undefined' && (window as any).__TAURI__,
      // Check for Tauri protocol
      typeof window !== 'undefined' && window.location.protocol === 'tauri:',
      // Check for Tauri in user agent
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri'),
      // Check for Tauri-specific APIs
      typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__,
      // Check for file:// protocol (only if NOT Electron)
      typeof window !== 'undefined' && window.location.protocol === 'file:' && !(window as any).isElectron,
    ];

    const isTauri = checks.some(check => check);
    // Enhanced Tauri detection completed

    return isTauri;
  }

  /**
   * PRODUCTION FIX: Get the correct resource paths for current environment
   */
  public static async getTauriResourcePaths(): Promise<{
    langPath: string;
    workerPath: string;
    corePath: string;
  }> {
    const isTauri = await this.detectTauriEnvironment();

    if (isTauri) {
      try {
        // Try to use convertFileSrc for proper Tauri asset URLs
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        console.log('🔧 Using Tauri convertFileSrc for asset URLs');
        return {
          langPath: convertFileSrc('tessdata'),
          workerPath: convertFileSrc('tesseract/worker.min.js'),
          corePath: convertFileSrc('tesseract/tesseract-core.wasm.js')
        };
      } catch (error) {
        console.warn('⚠️ convertFileSrc failed, using direct asset URLs:', error);
        // Fallback to direct asset protocol URLs
        return {
          langPath: 'https://asset.localhost/tessdata',
          workerPath: 'https://asset.localhost/tesseract/worker.min.js',
          corePath: 'https://asset.localhost/tesseract/tesseract-core.wasm.js'
        };
      }
    } else if (typeof window !== 'undefined' && (window as any).isElectron) {
      // Electron environment - use relative paths and override config
      console.log('🔧 Using Electron-specific OCR paths');
      return {
        langPath: './tessdata/',
        workerPath: './tesseract/worker.min.js',
        corePath: './tesseract/tesseract-core.wasm.js'
      };
    } else {
      // Web environment paths
      return {
        langPath: '/tessdata',
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core.wasm.js'
      };
    }
  }

  /**
   * Create worker using Tesseract.js CDN (for web deployments) with optimized timeouts
   */
  private static async createCDNWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback
  ): Promise<Tesseract.Worker> {
    try {
      console.log('🔧 Creating optimized CDN worker for web performance');
      
      // Use shorter timeout for single language, longer for multiple
      const optimizedTimeout = languages.length === 1 ? 
        Math.min(timeout, this.FAST_INIT_TIMEOUT) : 
        Math.min(timeout, this.ENHANCED_INIT_TIMEOUT);
        
      const worker = await Promise.race([
        createWorker(languages, 1, {
          logger: this.createLogger(onProgress)
          // No langPath - will use CDN
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('CDN worker timeout')), optimizedTimeout)
        )
      ]);

      console.log('✅ Optimized CDN worker created successfully');
      return worker;

    } catch (cdnError) {
      console.error('❌ CDN worker creation failed:', cdnError);
      throw cdnError;
    }
  }

  /**
   * PRODUCTION FIX: Create worker with enhanced Tauri-specific resource handling
   */
  private static async createWorkerWithFallback(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback
  ): Promise<Tesseract.Worker> {
    console.log('🔧 createWorkerWithFallback called with languages:', languages);

    const isTauri = await this.detectTauriEnvironment();
    console.log('🔧 Environment detected as Tauri:', isTauri);

    // For Tauri, use a more direct approach with local assets
    if (isTauri) {
      return this.createTauriWorker(languages, timeout, onProgress);
    }

    // Web environment - detect if we should skip local assets
    const isWebDeployment = typeof window !== 'undefined' && 
                           window.location.protocol.startsWith('http') && 
                           !window.location.hostname.includes('localhost') &&
                           !window.location.hostname.includes('127.0.0.1');

    if (isWebDeployment) {
      console.log('🔧 Web deployment detected, using CDN directly for optimal performance');
      return this.createCDNWorker(languages, timeout, onProgress);
    }

    // Local development - try local assets first
    try {
      // Get environment-specific resource paths
      const resourcePaths = await this.getTauriResourcePaths();
      console.log('🔧 Using resource paths for local development:', resourcePaths);

      // Based on Tesseract.js docs, try the correct parameter format
      const workerOptions = {
        logger: this.createLogger(onProgress),
        workerPath: resourcePaths.workerPath,
        corePath: resourcePaths.corePath,
        // The correct parameter might be 'langPath' with trailing slash
        langPath: resourcePaths.langPath.endsWith('/') ? resourcePaths.langPath : resourcePaths.langPath + '/'
      };

      console.log('🔧 Attempting worker with optimized paths:', workerOptions);

      // Debug: Test if assets are accessible
      try {
        const testResponse = await fetch(`${resourcePaths.langPath}/eng.traineddata`);
        console.log('🔍 Asset accessibility test - eng.traineddata:', testResponse.status, testResponse.statusText);
      } catch (error) {
        console.warn('⚠️ Asset accessibility test failed:', error);
      }

      // Try setting global Tesseract configuration
      if (typeof window !== 'undefined') {
        (window as any).Tesseract = (window as any).Tesseract || {};
        (window as any).Tesseract.langPath = resourcePaths.langPath + '/';
        console.log('🔧 Set global Tesseract.langPath:', (window as any).Tesseract.langPath);
      }

      console.log('🔧 Final worker options:', workerOptions);
      const worker = await Promise.race([
        createWorker(languages, 1, workerOptions),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Primary worker timeout')), timeout)
        )
      ]);

      console.log('✅ Worker created successfully with optimized paths');
      return worker;

    } catch (primaryError) {
      console.warn('⚠️ Primary optimized path failed:', primaryError);

      // Enhanced fallback strategy with environment-aware paths
      const fallbackConfigs = isTauri ? [
        // Tauri-specific fallback paths - try various combinations
        { langPath: 'tessdata', workerPath: 'tesseract/worker.min.js', corePath: 'tesseract/tesseract-core.wasm.js' },
        { langPath: './tessdata', workerPath: './tesseract/worker.min.js', corePath: './tesseract/tesseract-core.wasm.js' },
        { langPath: '/tessdata', workerPath: '/tesseract/worker.min.js', corePath: '/tesseract/tesseract-core.wasm.js' },
        { langPath: 'tessdata', workerPath: 'tesseract/worker.min.js' }, // No core path
        { langPath: './tessdata', workerPath: './tesseract/worker.min.js' }, // No core path
        { langPath: '/tessdata', workerPath: '/tesseract/worker.min.js' }, // No core path
        { langPath: 'tessdata' }, // Only language path
        { langPath: './tessdata' }, // Only language path
        { langPath: '/tessdata' }, // Only language path
      ] : [
        // Web-specific fallback paths
        { langPath: '/tessdata', workerPath: '/tesseract/worker.min.js', corePath: '/tesseract/tesseract-core.wasm.js' },
        { langPath: './tessdata', workerPath: './tesseract/worker.min.js', corePath: './tesseract/tesseract-core.wasm.js' },
        { langPath: '/tessdata', workerPath: '/tesseract/worker.min.js' }, // No core path
        { langPath: './tessdata', workerPath: './tesseract/worker.min.js' }, // No core path
        { langPath: '/tessdata' }, // Only language path
        { langPath: './tessdata' }, // Only language path
      ];

      for (const config of fallbackConfigs) {
        try {
          console.log(`🔧 Trying fallback config:`, config);

          const worker = await Promise.race([
            createWorker(languages, 1, {
              logger: this.createLogger(onProgress),
              ...config
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Fallback timeout`)), isTauri ? timeout / 2 : timeout / 4)
            )
          ]);

          console.log(`✅ Fallback worker created with config:`, config);
          return worker;

        } catch (fallbackError) {
          const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.warn(`⚠️ Fallback failed for config:`, config, 'Error:', errorMessage);
          continue;
        }
      }

      // Final attempt: CDN (only for web environment)
      if (!isTauri) {
        return this.createCDNWorker(languages, timeout, onProgress);
      } else {
        console.log('🚫 Skipping CDN fallback in Tauri environment (network restricted)');
      }

      console.error('❌ All worker creation methods failed');
      throw new Error(`All worker creation attempts failed. Last error: ${primaryError}`);
    }
  }

  /**
   * TAURI-SPECIFIC: Create worker optimized for Tauri environment
   */
  private static async createTauriWorker(
    languages: OCRLanguage[],
    timeout: number,
    onProgress?: OCRProgressCallback
  ): Promise<Tesseract.Worker> {
    console.log('🔧 Creating Tauri-optimized worker for languages:', languages);

    // CRITICAL: Force Tesseract.js to use ONLY local assets by providing ALL required paths
    // This prevents it from trying to load anything from CDN

    let tauriConfigs: any[] = [];

    try {
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      console.log('🔧 Using convertFileSrc for Tauri asset URLs');

      const langPath = convertFileSrc('tessdata');
      const workerPath = convertFileSrc('tesseract/worker.min.js');
      const corePath = convertFileSrc('tesseract/tesseract-core.wasm.js');

      tauriConfigs = [
        // Configuration 1: Complete local override with locateFile
        {
          langPath,
          workerPath,
          corePath,
          // CRITICAL: Override file location to prevent CDN access
          locateFile: (path: string, prefix: string) => {
            console.log('🔧 Tesseract locateFile called for:', path, 'prefix:', prefix);

            // Redirect all tesseract-core variants to our local version
            if (path.includes('tesseract-core') || path.includes('simd') || path.includes('lstm')) {
              console.log('🔧 Redirecting', path, 'to local core:', corePath);
              return corePath;
            }

            // For worker files
            if (path.includes('worker')) {
              console.log('🔧 Redirecting', path, 'to local worker:', workerPath);
              return workerPath;
            }

            // Default behavior for other files
            return prefix + path;
          }
        },
        // Configuration 2: Minimal but complete specification
        {
          langPath,
          workerPath,
          corePath
        },
        // Configuration 3: Language and worker only
        {
          langPath,
          workerPath
        }
      ];
    } catch (error) {
      console.warn('⚠️ convertFileSrc not available, using direct URLs');

      // Fallback configurations without convertFileSrc
      tauriConfigs = [
        // Configuration 4: Direct paths with CDN prevention
        {
          langPath: '/tessdata',
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/tesseract-core.wasm.js',
          gzip: false,
          cacheMethod: 'none',
          workerBlobURL: false
        },
        // Configuration 5: Simple direct paths
        {
          langPath: '/tessdata',
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/tesseract-core.wasm.js'
        },
        // Configuration 6: Language and worker only
        {
          langPath: '/tessdata',
          workerPath: '/tesseract/worker.min.js'
        }
      ];
    }

    for (let i = 0; i < tauriConfigs.length; i++) {
      const config = tauriConfigs[i];
      try {
        console.log(`🔧 Tauri attempt ${i + 1}/${tauriConfigs.length}:`, config);

        const worker = await Promise.race([
          createWorker(languages, 1, {
            logger: this.createLogger(onProgress),
            ...config
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tauri config ${i + 1} timeout`)), timeout / 3)
          )
        ]);

        console.log(`✅ Tauri worker created successfully with config ${i + 1}:`, config);
        return worker;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Tauri config ${i + 1} failed:`, errorMessage);

        // If this is the last config, throw the error
        if (i === tauriConfigs.length - 1) {
          throw new Error(`All Tauri worker configurations failed. Last error: ${errorMessage}`);
        }

        continue;
      }
    }

    throw new Error('Unexpected error in Tauri worker creation');
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
      this.cleanupExpiredWorkers();
      this.cleanupLanguageCache();
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
    // Check cache first
    if (this.detectionWorker) {
      this.detectionWorker.lastUsed = Date.now();
      this.detectionWorker.useCount++;
      console.log(`🎯 DETECTION CACHE HIT: Reusing detection worker (used ${this.detectionWorker.useCount} times)`);
      return this.detectionWorker.worker;
    }

    console.log('🔄 DETECTION CACHE MISS: Creating fast English-first detection worker...');

    // Report progress for worker initialization
    if (onProgress) {
      onProgress(0.1); // 10% - Starting worker creation
    }

    try {
      // OPTIMIZATION: Start with English only for fastest initialization
      const fastLanguages: OCRLanguage[] = ['eng'];
      console.log('⚡ Creating fast English-only detection worker for immediate use');
      
      if (onProgress) {
        onProgress(0.3); // 30% - Creating worker
      }
      
      const worker = await this.createWorkerWithFallback(fastLanguages, 10000, (progress) => {
        // Scale progress from 30% to 80% during worker creation
        if (onProgress) {
          onProgress(0.3 + (progress * 0.5));
        }
      });

      if (onProgress) {
        onProgress(0.8); // 80% - Worker created, caching
      }

      // Cache the fast worker
      this.detectionWorker = {
        worker,
        lastUsed: Date.now(),
        useCount: 1,
        languages: fastLanguages
      };

      this.startCleanupTimer();
      
      if (onProgress) {
        onProgress(1.0); // 100% - Complete
      }
      
      console.log('✅ Fast English-only detection worker created and cached');

      // ASYNC ENHANCEMENT: Start loading additional languages in background
      this.enhanceDetectionWorkerAsync()
        .then(() => console.log('🌍 Background language enhancement completed'))
        .catch(error => console.warn('⚠️ Background enhancement failed (non-critical):', error));

      return worker;

    } catch (error) {
      console.error('❌ Fast detection worker creation failed:', error);
      
      // Final fallback with CDN
      if (onProgress) {
        onProgress(0.5); // 50% - Trying CDN fallback
      }
      
      try {
        const worker = await this.createCDNWorker(['eng'], 15000, onProgress);
        
        this.detectionWorker = {
          worker,
          lastUsed: Date.now(),
          useCount: 1,
          languages: ['eng']
        };
        
        console.log('✅ CDN fallback detection worker created');
        return worker;
      } catch (cdnError) {
        console.error('❌ All detection worker creation attempts failed');
        throw new Error(`Detection worker initialization failed: ${error.message}`);
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
        20000
      );
      
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

    // Check cache first
    if (this.workers.has(workerKey)) {
      const cached = this.workers.get(workerKey)!;
      cached.lastUsed = Date.now();
      cached.useCount++;
      console.log(`🎯 EXTRACTION CACHE HIT: Reusing worker for ${workerKey} (used ${cached.useCount} times)`);
      return cached.worker;
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
      return this.createWorkerWithFallback(languages, 10000, onProgress);
    }
    
    // If multiple languages including English, start with English then enhance
    if (languages.includes('eng')) {
      console.log('⚡ Creating English-first worker, will enhance with additional languages');
      
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
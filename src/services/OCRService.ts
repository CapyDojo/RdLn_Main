/**
 * OCR Service - Main Interface
 * 
 * Provides a simplified interface for OCR text extraction with multi-language support.
 * This service coordinates between language detection, caching, and post-processing services.
 */

import { createWorker } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { OCRLanguage, CachedWorker, LanguageDetectionCacheEntry, OCROptions, OCRProgressCallback } from '../types/ocr-types';
import { SUPPORTED_LANGUAGES } from '../config/ocrConfig';
// PHASE 3.3: Import OCR Orchestrator for enhanced workflow coordination (SSMR Implementation)
import { OCROrchestrator, OrchestrationOptions } from '../services/OCROrchestrator';
// Import Language Detection Service for modular language detection
import { LanguageDetectionService } from '../services/LanguageDetectionService';
// Import OCRCacheManager for production-ready worker creation
import { OCRCacheManager } from '../services/OCRCacheManager';
// TAURI INTEGRATION: Import OCR router for Tauri-specific OCR handling
import { OCRRouter } from './OCRRouter';
import { DEV_CONFIG } from '../config/appConfig';

// Note: Re-exports removed to avoid module resolution conflicts

export class OCRService {
  private static workers: Map<string, CachedWorker> = new Map();
  private static loadingPromises: Map<string, Promise<TesseractWorker>> = new Map();
  private static detectionWorker: CachedWorker | null = null;
  
  // Language detection cache
  private static languageCache: Map<string, LanguageDetectionCacheEntry> = new Map();
  private static readonly LANGUAGE_CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_LANGUAGE_CACHE_ENTRIES = 50; // Memory limit
  
  // Cache configuration - TUNED: 30min expiry, adaptive cleanup, LRU eviction
  private static readonly CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes (tuned from 10min)
  private static readonly MAX_CACHED_WORKERS = 8; // Increased from 5 for better reuse
  private static readonly CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes (more frequent cleanup)
  private static readonly MEMORY_PRESSURE_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold for adaptive cleanup

  // Start cleanup timer on first use
  private static cleanupTimer: NodeJS.Timeout | null = null;

  private static startCleanupTimer() {
    if (this.cleanupTimer) return;
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredWorkers();
      this.cleanupLanguageCache();
    }, this.CLEANUP_INTERVAL_MS);
  }

  private static async cleanupExpiredWorkers() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired workers
    for (const [key, cached] of this.workers.entries()) {
      if (now - cached.lastUsed > this.CACHE_EXPIRY_MS) {
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
    if (this.detectionWorker && now - this.detectionWorker.lastUsed > this.CACHE_EXPIRY_MS) {
      if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 Cleaning up expired detection worker');
      await this.detectionWorker.worker.terminate();
      this.detectionWorker = null;
    }

    // If cache is too large, remove least recently used
    if (this.workers.size > this.MAX_CACHED_WORKERS) {
      const sortedEntries = Array.from(this.workers.entries())
        .sort(([,a], [,b]) => a.lastUsed - b.lastUsed);
      
      const toRemove = sortedEntries.slice(0, this.workers.size - this.MAX_CACHED_WORKERS);
      for (const [key, cached] of toRemove) {
        if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log(`🧹 Removing LRU OCR worker: ${key}`);
        await cached.worker.terminate();
        this.workers.delete(key);
      }
    }
  }

  // Language cache cleanup - TUNED: 30min expiry, adaptive cleanup, LRU eviction
  private static cleanupLanguageCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];
    let totalCacheSize = 0;

    // Find expired language cache entries and calculate cache statistics
    for (const [key, entry] of this.languageCache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.LANGUAGE_CACHE_EXPIRY_MS) {
        expiredKeys.push(key);
      }
      totalCacheSize++;
    }

    // Adaptive cleanup based on cache pressure
    const cachePressure = totalCacheSize > this.MAX_LANGUAGE_CACHE_ENTRIES * 0.8;
    const shouldAggressiveCleanup = cachePressure || expiredKeys.length > 5;

    if (shouldAggressiveCleanup) {
      console.log(`🧹 LANGUAGE CACHE ADAPTIVE CLEANUP: Size=${totalCacheSize}, Expired=${expiredKeys.length}, Pressure=${cachePressure}`);
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.languageCache.delete(key);
      console.log(`🧹 Cleaned up expired language detection cache entry: ${key.substring(0, 20)}...`);
    }

    // LRU eviction - more sophisticated scoring
    if (this.languageCache.size > this.MAX_LANGUAGE_CACHE_ENTRIES) {
      const sortedEntries = Array.from(this.languageCache.entries())
        .sort(([,a], [,b]) => {
          // Enhanced scoring: prioritize by hitCount, recency, and usage
          const scoreA = (a.hitCount * 10) - (now - a.timestamp) / 1000;
          const scoreB = (b.hitCount * 10) - (now - b.timestamp) / 1000;
          return scoreA - scoreB; // Lower score = less valuable
        });
      
      const maxEntries = cachePressure ? Math.floor(this.MAX_LANGUAGE_CACHE_ENTRIES * 0.7) : this.MAX_LANGUAGE_CACHE_ENTRIES;
      const toRemove = sortedEntries.slice(0, this.languageCache.size - maxEntries);
      
      for (const [key, entry] of toRemove) {
        this.languageCache.delete(key);
        console.log(`🧹 LRU eviction: Removing language cache entry: ${key.substring(0, 20)}... (hits: ${entry.hitCount}, age: ${Math.round((now - entry.timestamp)/1000)}s)`);
      }
    }
  }

  // Generate cache key for language detection
  private static async generateLanguageCacheKey(imageFile: File | Blob): Promise<string> {
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

  // Check language detection cache
  private static async checkLanguageCache(imageFile: File | Blob): Promise<OCRLanguage[] | null> {
    try {
      const cacheKey = await this.generateLanguageCacheKey(imageFile);
      const cached = this.languageCache.get(cacheKey);
      
      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < this.LANGUAGE_CACHE_EXPIRY_MS) {
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

  // Store language detection result in cache
  private static async storeLanguageCache(imageFile: File | Blob, languages: OCRLanguage[]): Promise<void> {
    try {
      const cacheKey = await this.generateLanguageCacheKey(imageFile);
      
      this.languageCache.set(cacheKey, {
        languages: [...languages], // Clone array
        timestamp: Date.now(),
        hitCount: 0
      });
      
      console.log(`💾 LANGUAGE CACHE STORE: Cached detection result for future use:`, languages);
      
      // Trigger cleanup if cache is getting large
      if (this.languageCache.size > this.MAX_LANGUAGE_CACHE_ENTRIES) {
        this.cleanupLanguageCache();
      }
    } catch (error) {
      console.warn('Failed to store language cache:', error);
    }
  }

  private static createLogger() {
    return (m: any) => {
      // Suppress most logging to reduce console noise
      if (m.status === 'recognizing text') {
        console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
      }
    };
  }

  private static getWorkerKey(languages: OCRLanguage[]): string {
    return languages.sort().join('-');
  }

  private static async initializeDetectionWorker(onProgress?: OCRProgressCallback): Promise<TesseractWorker> {
    // Check cache first
    if (this.detectionWorker) {
      this.detectionWorker.lastUsed = Date.now();
      this.detectionWorker.useCount++;
      console.log(`🎯 DETECTION CACHE HIT: Reusing detection worker (used ${this.detectionWorker.useCount} times)`);
      if (onProgress) onProgress(1.0); // Immediate completion for cached worker
      return this.detectionWorker.worker;
    }

    // Use OCRCacheManager's optimized detection worker initialization with progress
    console.log('🔄 DETECTION CACHE MISS: Delegating to OCRCacheManager for optimized detection worker');
    
    const worker = await OCRCacheManager.initializeDetectionWorker(onProgress);

    // Cache the worker locally for OCRService tracking
    this.detectionWorker = {
      worker,
      lastUsed: Date.now(),
      useCount: 1,
      languages: ['eng'] // Start with English, enhanced in background
    };

    this.startCleanupTimer();
    console.log('✅ Optimized detection worker obtained and cached locally');
    return worker;
  }

  private static async initializeWorker(languages: OCRLanguage[], onProgress?: OCRProgressCallback): Promise<TesseractWorker> {
    // PRODUCTION FIX: Use OCRCacheManager's fixed worker creation
    console.log(`🔄 OCRService delegating to OCRCacheManager for languages: ${languages.join(', ')}`);
    return OCRCacheManager.initializeWorker(languages, onProgress);
  }

  /**
   * Language detection - delegated to LanguageDetectionService for modularity
   */
  public static async detectLanguage(imageFile: File | Blob, onProgress?: OCRProgressCallback): Promise<OCRLanguage[]> {
    // TAURI INTEGRATION: Route to appropriate language detection provider
    return OCRRouter.routeLanguageDetection(imageFile, (imageFile) => {
      return LanguageDetectionService.detectLanguage(imageFile, onProgress);
    });
  }

  public static async extractTextFromImage(
    imageFile: File | Blob, 
    options: OCROptions = {}
  ): Promise<string> {
    // TAURI INTEGRATION: Route to appropriate OCR provider
    return OCRRouter.routeOCRRequest(imageFile, options, (imageFile, options) => {
      return this.extractTextFromImageLegacy(imageFile, options);
    });
  }

  // TAURI INTEGRATION: Renamed original method to avoid conflicts
  private static async extractTextFromImageLegacy(
    imageFile: File | Blob, 
    options: OCROptions = {}
  ): Promise<string> {
    // PHASE 3.3: Enhanced workflow using OCR Orchestrator (opt-in)
    if (options.useOrchestrator) {
      console.log('🎼 Using enhanced OCR Orchestrator workflow...');
      
      try {
        // Convert OCROptions to OrchestrationOptions
        const orchestrationOptions: OrchestrationOptions = {
          languages: options.languages,
          autoDetect: options.autoDetect,
          primaryLanguage: options.primaryLanguage,
          // Enable enhanced features in orchestrator
          useBackgroundLoader: true,
          performanceTracking: true,
          textProcessing: {
            preserveParagraphs: true,
            applyLegalTermFixes: true,
            enhancedPunctuation: true
          }
        };
        
        const result = await OCROrchestrator.extractText(imageFile, orchestrationOptions);
        
        // Enhanced OCR completed with orchestrator
        
        return result.text;
      } catch (error) {
        console.warn('⚠️ Orchestrator failed, falling back to legacy OCR:', error);
        // Fall through to legacy implementation
      }
    }
    
    // UNIFIED WORKER PIPELINE - OPTIMIZED FOR WORKER REUSE
    try {
      let finalLanguages: OCRLanguage[];
      let progressiveLanguages: OCRLanguage[] = [];

      if (options.autoDetect !== false) {
        // UNIFIED WORKER: Use single worker for both detection and extraction
        console.log('🔍 Using unified worker pipeline - detection and extraction with single worker...');
        
        // Start with English worker for unified pipeline
        const workerStart = Date.now();
        const unifiedWorker = await this.initializeWorker(['eng'], options.onProgress);
        const workerInitTime = Date.now() - workerStart;
        console.log(`⏱️ Unified worker initialized in ${workerInitTime}ms`);

        // PHASE 1: OSD Detection with the same worker
        const detectionStart = Date.now();
        let scriptData;
        try {
          // CRITICAL FIX: Validate worker before calling detect
          if (!unifiedWorker || typeof unifiedWorker.detect !== 'function') {
            throw new Error('Worker is invalid or does not support detect method');
          }
          
          const { data } = await unifiedWorker.detect(imageFile);
          scriptData = data.script;
        } catch (error) {
          console.warn('⚠️ OSD detection failed:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('legacy') || 
              errorMessage.includes('detect requires Legacy model') ||
              errorMessage.includes('postMessage') ||
              errorMessage.includes('null') ||
              errorMessage.includes('invalid')) {
            console.log('🔄 Falling back to English due to worker/legacy issue');
            scriptData = { script: 'Latin', confidence: 100 };
          } else {
            throw error;
          }
        }
        const detectionTime = Date.now() - detectionStart;
        console.log(`⏱️ OSD detection completed in ${detectionTime}ms`);

        // Map detected script to languages
        const detectedLanguages = this.mapScriptToLanguages(scriptData);
        progressiveLanguages = detectedLanguages;
        console.log('📝 Detected languages from OSD:', detectedLanguages.map(lang => 
          SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name || lang
        ).join(', '));

        // PHASE 2: Progressive extraction with unified worker
        if (detectedLanguages.length > 1 || (detectedLanguages[0] && detectedLanguages[0] !== 'eng')) {
          console.log('🔄 Adding detected languages to unified worker...');
          
          // Reuse the same worker by adding languages
          const additionalLanguages = detectedLanguages.filter(lang => lang !== 'eng');
          const enhancedLanguages = ['eng', ...additionalLanguages];
          
          // Update worker with new languages without re-initialization
          const updateStart = Date.now();
          await unifiedWorker.loadLanguage(enhancedLanguages);
          await unifiedWorker.initialize(enhancedLanguages.join('+'));
          const updateTime = Date.now() - updateStart;
          console.log(`⏱️ Worker updated with ${additionalLanguages.length} additional languages in ${updateTime}ms`);

          finalLanguages = enhancedLanguages;
        } else {
          finalLanguages = ['eng'];
        }

        // PHASE 3: Final extraction with unified worker
        const extractionStart = Date.now();
        const { data: { text: finalText } } = await unifiedWorker.recognize(imageFile);
        const extractionTime = Date.now() - extractionStart;
        console.log(`⏱️ Final extraction completed in ${extractionTime}ms`);

        // Use final text with all detected languages
        const processedText = this.multiLanguagePostProcessing(finalText, finalLanguages);
        return processedText;

      } else if (options.languages && options.languages.length > 0) {
        // Use specified languages - single worker approach
        progressiveLanguages = options.languages;
        finalLanguages = options.languages;
        
        console.log('🚀 Using unified worker for specified languages...');
        
        const workerStart = Date.now();
        const unifiedWorker = await this.initializeWorker(finalLanguages, options.onProgress);
        const workerInitTime = Date.now() - workerStart;
        console.log(`⏱️ Unified worker initialized in ${workerInitTime}ms`);

        const extractionStart = Date.now();
        const { data: { text } } = await unifiedWorker.recognize(imageFile);
        const extractionTime = Date.now() - extractionStart;
        console.log(`⏱️ Extraction completed in ${extractionTime}ms`);

        const processedText = this.multiLanguagePostProcessing(text, finalLanguages);
        return processedText;

      } else {
        // Default to English - single worker
        finalLanguages = ['eng'];
        
        console.log('🚀 Using unified worker for English extraction...');
        
        const workerStart = Date.now();
        const unifiedWorker = await this.initializeWorker(['eng'], options.onProgress);
        const workerInitTime = Date.now() - workerStart;
        console.log(`⏱️ Unified worker initialized in ${workerInitTime}ms`);

        const extractionStart = Date.now();
        const { data: { text } } = await unifiedWorker.recognize(imageFile);
        const extractionTime = Date.now() - extractionStart;
        console.log(`⏱️ English extraction completed in ${extractionTime}ms`);

        const processedText = this.multiLanguagePostProcessing(text, ['eng']);
        return processedText;
      }

    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // UNIFIED WORKER: Map OSD script detection to language codes
  private static mapScriptToLanguages(script: any): OCRLanguage[] {
    if (!script || !script.script) {
      console.log('⚠️ No script detected, defaulting to English');
      return ['eng'];
    }

    const confidence = script.confidence || 0;
    const detectedScript = script.script;

    if (confidence < 30) {
      console.log(`⚠️ Low confidence (${confidence}%), defaulting to English`);
      return ['eng'];
    }

    console.log(`📊 Detected script: ${detectedScript} with confidence: ${confidence}%`);

    // Map Tesseract.js script codes to OCR language codes
    const scriptToLanguageMap: Record<string, OCRLanguage[]> = {
      'Han': ['chi_sim', 'chi_tra'],
      'Hani': ['chi_sim', 'chi_tra'],
      'Japanese': ['jpn'],
      'Hiragana': ['jpn'],
      'Katakana': ['jpn'],
      'Korean': ['kor'],
      'Hangul': ['kor'],
      'Arabic': ['ara'],
      'Hebrew': ['eng'], // Fallback for Hebrew
      'Cyrillic': ['rus'],
      'Latin': ['eng', 'spa', 'fra', 'deu'],
      'Devanagari': ['eng'], // Fallback for Devanagari
      'Thai': ['eng'], // Fallback for Thai
      'Tamil': ['eng'], // Fallback for Tamil
    };

    const languages = scriptToLanguageMap[detectedScript] || ['eng'];
    console.log(`🗣️ Mapped script to languages: ${languages.join(', ')}`);
    return languages;
  }

  // STAGE 2: Safe primary language selection (capability-based priority)
  private static selectPrimaryLanguage(detectedLanguages: OCRLanguage[]): OCRLanguage {
    // Capability-based priority: Most capable OCR models first (handle multiple scripts)
    const capabilityPriority: OCRLanguage[] = [
      'chi_sim',    // Handles Chinese + Latin alphabet
      'chi_tra',    // Handles Traditional Chinese + Latin
      'jpn',        // Handles Japanese scripts + Latin
      'kor',        // Handles Korean + Latin  
      'ara',        // Handles Arabic + some Latin
      'rus',        // Handles Cyrillic + some Latin
      'eng',        // Handles Latin alphabet only
      'fra',        // Handles Latin + French diacritics
      'deu',        // Handles Latin + German characters
      'spa'         // Handles Latin + Spanish characters
    ];
    
    // Select highest priority language from detected languages
    for (const lang of capabilityPriority) {
      if (detectedLanguages.includes(lang)) {
        console.log(`🎯 Primary language selected: ${lang} from detected: [${detectedLanguages.join(', ')}]`);
        return lang;
      }
    }
    
    // Safe fallback
    console.log(`🔄 No priority language found, defaulting to English from: [${detectedLanguages.join(', ')}]`);
    return 'eng';
  }

  private static multiLanguagePostProcessing(text: string, languages: OCRLanguage[]): string {
    // STAGE 2: Primary language selection + universal preservation
    const primaryLanguage = this.selectPrimaryLanguage(languages);
    console.log('🧘 Processing with primary language:', primaryLanguage, 'from detected:', languages.join(', '));
    
    let processed = this.gentleUniversalPreservation(text);
    
    // Remove single spaces between CJK characters only - repeat until no more matches
    const cjk = '[\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af\\u3000-\\u303f\\uff00-\\uffef]';
    const cjkSpaceRegex = new RegExp(`(${cjk}) (${cjk})`, 'g');
    let previousText;
    do {
      previousText = processed;
      processed = processed.replace(cjkSpaceRegex, '$1$2');
    } while (processed !== previousText);
    
    return processed;
  }

  private static chinesePostProcessing(text: string): string {
    return text
      // Fix common Chinese OCR errors
      .replace(/。\s*(?=[^\s])/g, '。 ')  // Add space after period
      .replace(/，\s*(?=[^\s])/g, '， ')  // Add space after comma
      .replace(/；\s*(?=[^\s])/g, '； ')  // Add space after semicolon
      .replace(/：\s*(?=[^\s])/g, '： ')  // Add space after colon
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  private static japanesePostProcessing(text: string): string {
    return text
      // Fix Japanese punctuation spacing
      .replace(/。\s*(?=[^\s])/g, '。')   // No space after period in Japanese
      .replace(/、\s*(?=[^\s])/g, '、')   // No space after comma in Japanese
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  private static koreanPostProcessing(text: string): string {
    return text
      // Fix Korean punctuation and spacing
      .replace(/\.\s*(?=[^\s])/g, '. ')  // Add space after period
      .replace(/,\s*(?=[^\s])/g, ', ')   // Add space after comma
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  private static arabicPostProcessing(text: string): string {
    return text
      // Fix Arabic text direction and punctuation
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      // Arabic-specific fixes would go here
      .trim();
  }

  private static russianPostProcessing(text: string): string {
    return text
      // Fix Cyrillic character recognition errors
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      // Russian-specific fixes would go here
      .trim();
  }

  private static europeanLanguagePostProcessing(text: string, language: OCRLanguage): string {
    // ENHANCED: Apply universal paragraph preservation for European languages
    let processed = this.universalParagraphPreservation(text);

    // Language-specific character and punctuation fixes
    switch (language) {
      case 'fra':
        // French-specific punctuation rules
        processed = processed
          .replace(/\s+([!?:;])/g, ' $1')  // Space before exclamation, question, colon, semicolon
          .replace(/«\s*/g, '« ')          // French quotes
          .replace(/\s*»/g, ' »');
        break;
      case 'deu':
        // German-specific fixes
        processed = processed
          .replace(/ß/g, 'ß')              // Ensure proper ß character
          .replace(/ae/g, 'ä')             // Common OCR error
          .replace(/oe/g, 'ö')             // Common OCR error
          .replace(/ue/g, 'ü');            // Common OCR error
        break;
      case 'spa':
        // Spanish-specific fixes
        processed = processed
          .replace(/n~/g, 'ñ')             // Fix ñ character
          .replace(/¿\s*/g, '¿')           // Spanish question marks
          .replace(/\s*\?/g, '?')
          .replace(/¡\s*/g, '¡')           // Spanish exclamation marks
          .replace(/\s*!/g, '!');
        break;
    }

    // Final cleanup while preserving paragraph structure
    return this.finalCleanupUniversal(processed);
  }

  // Keep the original English post-processing method
  private static enhancedPostProcessing(text: string): string {
    // Step 1: Basic cleanup
    let processed = this.basicCleanup(text);
    
    // Step 2: Fix common OCR character errors
    processed = this.fixCharacterErrors(processed);
    
    // Step 3: Fix number formatting issues
    processed = this.fixNumberFormatting(processed);
    
    // Step 4: Fix legal/business terminology
    processed = this.fixLegalTerminology(processed);
    
    // Step 5: Fix spacing and punctuation
    processed = this.fixSpacingAndPunctuation(processed);
    
    // Step 6: Reconstruct paragraphs intelligently
    processed = this.intelligentParagraphReconstruction(processed);
    
    // Step 7: Final cleanup
    processed = this.finalCleanup(processed);
    
    return processed;
  }

  private static basicCleanup(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  private static fixCharacterErrors(text: string): string {
    // Common OCR character substitution errors
    const characterFixes = [
      // Numbers and letters confusion
      [/\b0(?=[a-zA-Z])/g, 'O'],           // 0 before letters -> O
      [/(?<=[a-zA-Z])0\b/g, 'O'],         // 0 after letters -> O
      [/\b1(?=[a-zA-Z])/g, 'I'],          // 1 before letters -> I
      [/(?<=[a-zA-Z])1\b/g, 'l'],         // 1 after letters -> l
      [/\|/g, 'I'],                       // Pipe to I
      [/(?<!\d)5(?=\d)/g, 'S'],           // 5 at start of word -> S
      [/8(?=[a-zA-Z])/g, 'B'],            // 8 before letters -> B
      
      // Common punctuation errors
      [/\s*,\s*(?=\d)/g, ','],            // Fix comma spacing before numbers
      [/(\d)\s*,\s*(\d)/g, '$1,$2'],      // Fix number comma formatting
      [/\s*\.\s*(?=\d)/g, '.'],           // Fix period spacing before numbers
      [/(\d)\s*\.\s*(\d)/g, '$1.$2'],     // Fix decimal formatting
      
      // Quote and apostrophe fixes
      [/[""]/g, '"'],                     // Smart quotes to regular
      [/['']/g, "'"],                     // Smart apostrophes to regular
      
      // Common word boundary issues
      [/\bthe\s+(?=\d)/g, 'the '],        // "the" before numbers
      [/\bof\s+(?=\d)/g, 'of '],          // "of" before numbers
      [/\band\s+(?=\d)/g, 'and '],        // "and" before numbers
    ];

    let result = text;
    characterFixes.forEach(([pattern, replacement]) => {
      result = result.replace(pattern as RegExp, replacement as string);
    });

    return result;
  }

  private static fixNumberFormatting(text: string): string {
    let result = text;

    // Fix common number formatting issues
    const numberFixes = [
      // Fix concatenated numbers like "2,000500" -> "2,000" or "2,500"
      [/(\d{1,3}),(\d{3})(\d{3})/g, (match: string, p1: string, p2: string, p3: string) => {
        // If the third group looks like a separate number, split them
        if (p3.length === 3 && parseInt(p3) < 600) {
          return `${p1},${p2} ${p3}`;
        }
        return `${p1},${p2},${p3}`;
      }],
      
      // Fix malformed currency
      [/\$\s*(\d)/g, '$$$1'],              // Fix "$ 100" -> "$100"
      [/(\d)\s*\$(?!\d)/g, '$1$'],         // Fix "100 $" -> "100$"
      
      // Fix percentage formatting
      [/(\d)\s*%/g, '$1%'],                // Fix "50 %" -> "50%"
      [/%\s*(\d)/g, '% $1'],               // Fix "%50" -> "% 50"
      
      // Fix decimal issues
      [/(\d)\s*\.\s*(\d)/g, '$1.$2'],      // Fix "3 . 14" -> "3.14"
      
      // Fix date formatting
      [/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/g, '$1/$2/$3'],
      
      // Fix phone number formatting
      [/(\d{3})\s*-\s*(\d{3})\s*-\s*(\d{4})/g, '$1-$2-$3'],
    ];

    numberFixes.forEach(([pattern, replacement]) => {
      result = result.replace(pattern as RegExp, replacement as string | Function);
    });

    return result;
  }

  private static fixLegalTerminology(text: string): string {
    // Common legal/business terms that get OCR'd incorrectly
    const legalTermFixes = [
      // Contract terms
      [/\bwhereas\b/gi, 'WHEREAS'],
      [/\bnow therefore\b/gi, 'NOW THEREFORE'],
      [/\bin witness whereof\b/gi, 'IN WITNESS WHEREOF'],
      [/\bto wit\b/gi, 'to wit'],
      [/\binter alia\b/gi, 'inter alia'],
      [/\be\.g\.\b/gi, 'e.g.'],
      [/\bi\.e\.\b/gi, 'i.e.'],
      [/\betc\.\b/gi, 'etc.'],
      
      // Legal entities
      [/\bllc\b/gi, 'LLC'],
      [/\binc\b(?=\.|\s|$)/gi, 'Inc'],
      [/\bcorp\b(?=\.|\s|$)/gi, 'Corp'],
      [/\bltd\b(?=\.|\s|$)/gi, 'Ltd'],
      
      // Common legal phrases
      [/\bforce majeure\b/gi, 'force majeure'],
      [/\bfob\b/gi, 'FOB'],
      [/\bcif\b/gi, 'CIF'],
      [/\bfca\b/gi, 'FCA'],
      
      // Fix common word splits
      [/\bthere fore\b/gi, 'therefore'],
      [/\bthere of\b/gi, 'thereof'],
      [/\bthere in\b/gi, 'therein'],
      [/\bthere under\b/gi, 'thereunder'],
      [/\bwhere as\b/gi, 'whereas'],
      [/\bwhere in\b/gi, 'wherein'],
      [/\bwhere by\b/gi, 'whereby'],
      [/\bwhere upon\b/gi, 'whereupon'],
      
      // Fix common legal abbreviations
      [/\bp\s*\.\s*a\s*\./gi, 'p.a.'],
      [/\bv\s*\.\s*(?=[A-Z])/g, 'v. '],     // Case citations
      [/\bvs\s*\.\s*(?=[A-Z])/g, 'vs. '],   // Case citations
      
      // Fix section references
      [/\bsection\s+(\d+)/gi, 'Section $1'],
      [/\bsec\s*\.\s*(\d+)/gi, 'Sec. $1'],
      [/\bparagraph\s+(\d+)/gi, 'Paragraph $1'],
      [/\bpara\s*\.\s*(\d+)/gi, 'Para. $1'],
    ];

    let result = text;
    legalTermFixes.forEach(([pattern, replacement]) => {
      result = result.replace(pattern as RegExp, replacement as string);
    });

    return result;
  }

  private static fixSpacingAndPunctuation(text: string): string {
    let result = text;

    // Fix spacing issues
    const spacingFixes = [
      // Multiple spaces to single space
      [/\s{2,}/g, ' '],
      
      // Fix spacing around punctuation
      [/\s+([,.;:!?])/g, '$1'],           // Remove space before punctuation
      [/([,.;:!?])(?=[a-zA-Z])/g, '$1 '], // Add space after punctuation
      [/([.!?])([A-Z])/g, '$1 $2'],       // Space after sentence-ending punctuation
      
      // Fix parentheses spacing
      [/\(\s+/g, '('],                    // Remove space after opening paren
      [/\s+\)/g, ')'],                    // Remove space before closing paren
      [/\)(?=[a-zA-Z])/g, ') '],          // Add space after closing paren
      
      // Fix quote spacing
      [/"\s+/g, '"'],                     // Remove space after opening quote
      [/\s+"/g, '"'],                     // Remove space before closing quote
      
      // Fix hyphen and dash spacing
      [/\s+-\s+/g, ' - '],                // Standardize dash spacing
      [/(\w)-(\w)/g, '$1-$2'],            // Remove spaces in hyphenated words
      
      // Fix colon spacing (important for legal documents)
      [/:\s*(?=[A-Z])/g, ': '],           // Standardize colon spacing
      
      // Fix semicolon spacing
      [/;\s*(?=[a-zA-Z])/g, '; '],        // Standardize semicolon spacing
    ];

    spacingFixes.forEach(([pattern, replacement]) => {
      result = result.replace(pattern as RegExp, replacement as string);
    });

    return result;
  }

  private static intelligentParagraphReconstruction(text: string): string {
    // CONSERVATIVE APPROACH: Preserve existing paragraph structure while fixing obvious line breaks
    const lines = text.split('\n');
    const result: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const prevLine = i > 0 ? lines[i - 1]?.trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1]?.trim() : '';

      // Skip empty lines - they indicate paragraph breaks
      if (line.length === 0) {
        // Finish current paragraph if we have one
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
          currentParagraph = '';
        }
        continue;
      }

      // Definitely start new paragraph for legal/formal indicators
      if (this.isDefiniteNewParagraph(line)) {
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
        }
        currentParagraph = line;
        continue;
      }

      // Only join lines if there's clear evidence they should be joined
      if (currentParagraph && this.shouldDefinitelyJoin(currentParagraph, line)) {
        // Join with previous line (handle hyphenation)
        currentParagraph += (currentParagraph.endsWith('-') ? '' : ' ') + line;
      } else {
        // DEFAULT: Start new paragraph (preserve paragraph breaks)
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
        }
        currentParagraph = line;
      }
    }

    // Add final paragraph
    if (currentParagraph.trim()) {
      result.push(currentParagraph.trim());
    }

    return result.join('\n\n');
  }

  private static isNewParagraphStart(line: string, currentParagraph: string): boolean {
    // Legal document paragraph indicators
    const paragraphStarters = [
      /^\d+\./,                           // Numbered paragraphs
      /^[A-Z]\./,                         // Lettered paragraphs
      /^\([a-z]\)/,                       // Lettered sub-paragraphs
      /^\([0-9]+\)/,                      // Numbered sub-paragraphs
      /^WHEREAS\b/i,                      // Contract clauses
      /^NOW THEREFORE\b/i,                // Contract clauses
      /^IN WITNESS WHEREOF\b/i,           // Contract clauses
      /^Section\s+\d+/i,                  // Section headers
      /^Article\s+\d+/i,                  // Article headers
      /^Chapter\s+\d+/i,                  // Chapter headers
      /^[A-Z][A-Z\s]{3,}:/,              // ALL CAPS headers with colon
      /^[A-Z][a-z]+\s+[A-Z][a-z]+:/,     // Title Case headers with colon
    ];

    return paragraphStarters.some(pattern => pattern.test(line)) && currentParagraph.length > 0;
  }

  private static shouldJoinWithPrevious(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // Don't join if current line looks like a new paragraph
    if (this.isNewParagraphStart(line, currentParagraph)) return false;

    // Join if previous line ends incompletely
    const incompleteEndings = [
      /,$/,                               // Ends with comma
      /\sand$/,                           // Ends with "and"
      /\sor$/,                            // Ends with "or"
      /\sof$/,                            // Ends with "of"
      /\sto$/,                            // Ends with "to"
      /\sthe$/,                           // Ends with "the"
      /\sa$/,                             // Ends with "a"
      /\san$/,                            // Ends with "an"
      /\sin$/,                            // Ends with "in"
      /\sfor$/,                           // Ends with "for"
      /\swith$/,                          // Ends with "with"
      /\sby$/,                            // Ends with "by"
      /\sfrom$/,                          // Ends with "from"
      /-$/,                               // Ends with hyphen
      /\sthat$/,                          // Ends with "that"
      /\swhich$/,                         // Ends with "which"
      /\swho$/,                           // Ends with "who"
      /\swhere$/,                         // Ends with "where"
      /\swhen$/,                          // Ends with "when"
    ];

    if (incompleteEndings.some(pattern => pattern.test(currentParagraph.trim()))) {
      return true;
    }

    // Join if current line starts with lowercase (likely continuation)
    if (/^[a-z]/.test(line)) return true;

    // Join if current line starts with continuation words
    const continuationStarters = [
      /^and\b/i,
      /^or\b/i,
      /^but\b/i,
      /^however\b/i,
      /^therefore\b/i,
      /^furthermore\b/i,
      /^moreover\b/i,
      /^nevertheless\b/i,
      /^accordingly\b/i,
    ];

    return continuationStarters.some(pattern => pattern.test(line));
  }

  private static shouldEndParagraph(currentLine: string, nextLine: string): boolean {
    if (!nextLine) return true;

    // End paragraph if next line starts a new paragraph
    if (this.isNewParagraphStart(nextLine, currentLine)) return true;

    // End paragraph after sentence-ending punctuation if next line starts with capital
    if (/[.!?]$/.test(currentLine.trim()) && /^[A-Z]/.test(nextLine.trim())) {
      return true;
    }

    return false;
  }

  // Conservative helper methods for paragraph reconstruction
  private static isDefiniteNewParagraph(line: string): boolean {
    // Only mark as definite new paragraph for very clear indicators
    const definiteStarters = [
      /^\d+\./,                           // Numbered paragraphs like "1."
      /^[A-Z]\./,                         // Lettered paragraphs like "A."
      /^\([a-z]\)/,                       // Lettered sub-paragraphs like "(a)"
      /^\([0-9]+\)/,                      // Numbered sub-paragraphs like "(1)"
      /^WHEREAS\b/i,                      // Contract clauses
      /^NOW THEREFORE\b/i,                // Contract clauses
      /^IN WITNESS WHEREOF\b/i,           // Contract clauses
      /^Section\s+\d+/i,                  // Section headers
      /^Article\s+\d+/i,                  // Article headers
      /^Chapter\s+\d+/i,                  // Chapter headers
    ];

    return definiteStarters.some(pattern => pattern.test(line));
  }

  private static shouldDefinitelyJoin(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // Don't join if current line looks like a new paragraph
    if (this.isDefiniteNewParagraph(line)) return false;

    // Only join if there's very clear evidence lines should be joined
    const clearJoinIndicators = [
      /-$/,                               // Previous line ends with hyphen
      /,$/,                               // Previous line ends with comma
      /\sand$/,                           // Previous line ends with "and"
      /\sor$/,                            // Previous line ends with "or"
    ];

    // Check if previous line has clear join indicator
    if (clearJoinIndicators.some(pattern => pattern.test(currentParagraph.trim()))) {
      return true;
    }

    // Join if current line starts with lowercase (likely continuation)
    if (/^[a-z]/.test(line)) return true;

    return false;
  }

  private static shouldDefinitelyEndParagraph(currentParagraph: string, line: string): boolean {
    // Only end paragraph if we have very strong evidence
    
    // End if next line is definitely a new paragraph
    if (this.isDefiniteNewParagraph(line)) return true;

    // End if current paragraph ends with sentence punctuation and next starts with capital
    if (/[.!?]$/.test(currentParagraph.trim()) && /^[A-Z]/.test(line.trim())) {
      return true;
    }

    return false;
  }

  private static finalCleanup(text: string): string {
    return text
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim each paragraph
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .join('\n\n')
      // Final trim
      .trim();
  }

  public static getLanguageInfo(languageCode: OCRLanguage): LanguageOption | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  }

  // Enhanced cache statistics for monitoring
  public static getCacheStats() {
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

  // Universal paragraph preservation function for all European languages
  private static universalParagraphPreservation(text: string): string {
    // SAFE UNIVERSAL APPROACH: Preserve existing structure while fixing obvious issues
    const lines = text.split('\n');
    const result: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines - they indicate paragraph breaks
      if (line.length === 0) {
        // Finish current paragraph if we have one
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
          currentParagraph = '';
        }
        continue;
      }

      // Universal paragraph starters (work across European languages)
      if (this.isUniversalNewParagraph(line)) {
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
        }
        currentParagraph = line;
        continue;
      }

      // Universal line joining (very conservative)
      if (currentParagraph && this.shouldUniversallyJoin(currentParagraph, line)) {
        // Join with previous line (handle hyphenation)
        currentParagraph += (currentParagraph.endsWith('-') ? '' : ' ') + line;
      } else {
        // DEFAULT: Start new paragraph (preserve paragraph breaks)
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
        }
        currentParagraph = line;
      }
    }

    // Add final paragraph
    if (currentParagraph.trim()) {
      result.push(currentParagraph.trim());
    }

    return result.join('\n\n');
  }

  // Universal paragraph starter detection (language-agnostic)
  private static isUniversalNewParagraph(line: string): boolean {
    // Only very obvious paragraph starters that work across languages
    const universalStarters = [
      /^\d+\./,                           // Numbered paragraphs like "1."
      /^[A-Z]\./,                         // Lettered paragraphs like "A."
      /^\([a-z]\)/,                       // Lettered sub-paragraphs like "(a)"
      /^\([0-9]+\)/,                      // Numbered sub-paragraphs like "(1)"
      /^[IVX]+\./,                        // Roman numerals like "I.", "II."
    ];

    return universalStarters.some(pattern => pattern.test(line));
  }

  // Universal line joining (very conservative, works across languages)
  private static shouldUniversallyJoin(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // Don't join if current line looks like a new paragraph
    if (this.isUniversalNewParagraph(line)) return false;

    // Only join with very clear universal indicators
    const universalJoinIndicators = [
      /-$/,                               // Previous line ends with hyphen (universal)
      /,$/,                               // Previous line ends with comma (universal)
    ];

    // Check if previous line has clear join indicator
    if (universalJoinIndicators.some(pattern => pattern.test(currentParagraph.trim()))) {
      return true;
    }

    // Join if current line starts with lowercase (universal continuation)
    if (/^[a-z]/.test(line)) return true;

    return false;
  }

  // Universal final cleanup (preserves paragraph structure)
  private static finalCleanupUniversal(text: string): string {
    return text
      // Clean up excessive spaces within lines
      .replace(/\s{2,}/g, ' ')
      // Remove excessive line breaks (preserve double breaks for paragraphs)
      .replace(/\n{3,}/g, '\n\n')
      // Trim each paragraph
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .join('\n\n')
      // Final trim
      .trim();
  }

  // STAGE 1: Gentle universal preservation - preserves paragraph structure for ALL languages
  private static gentleUniversalPreservation(text: string): string {
    console.log('🧘 Re-evaluating paragraph preservation...');

    const lines = text.split('\n');
    const result: string[] = [];
    let currentParagraph = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        // Empty line: end of paragraph
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
          currentParagraph = '';
        }
        continue;
      }

      // Detect definitive paragraph starters (numbered sections, legal headers)
      const definiteParagraphStart = /^[1-9]\d*\.|^[A-Z]\.|^\([a-z]\)|^\([0-9]+\)|^WHEREAS\b|^NOW THEREFORE\b|^IN WITNESS WHEREOF\b/i.test(line);

      // Intelligent line joining logic
      if (currentParagraph && !definiteParagraphStart) {
        // Check if we should join this line with the previous paragraph
        const shouldJoin = this.shouldJoinLines(currentParagraph, line);
        
        if (shouldJoin) {
          currentParagraph += ' ' + line;
        } else {
          // Start new paragraph
          result.push(currentParagraph.trim());
          currentParagraph = line;
        }
      } else {
        // Definitive paragraph start or first line
        if (currentParagraph.trim()) {
          result.push(currentParagraph.trim());
        }
        currentParagraph = line;
      }
    }

    if (currentParagraph.trim()) {
      result.push(currentParagraph.trim());
    }
    return result.join('\n\n');
  }

  // ZEN APPROACH: Simple and effective - preserve clear paragraph breaks, join everything else
  private static shouldJoinLines(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // DON'T join if current line is clearly a new paragraph
    if (this.isDefiniteNewParagraph(line)) {
      return false;
    }

    // DON'T join if previous line ends with punctuation and next starts like a new sentence
    if (this.isPunctuationBreak(currentParagraph, line)) {
      console.log('🔤 Punctuation break detected - preserving break:', currentParagraph.slice(-20), '|', line.slice(0, 30));
      return false;
    }

    // JOIN everything else - simple and effective!
    console.log('🧘 Zen joining:', currentParagraph.slice(-20), '|', line.slice(0, 30));
    return true;
  }

  // Check for punctuation-based paragraph breaks (script-agnostic)
  private static isPunctuationBreak(currentParagraph: string, line: string): boolean {
    const currentTrimmed = currentParagraph.trim();
    const lineTrimmed = line.trim();
    
    if (!currentTrimmed || !lineTrimmed) return false;

    // Check if current paragraph ends with any punctuation
    const endsWithPunctuation = /[.!?。！？]\s*$/.test(currentTrimmed);
    
    // Check if next line starts like a new sentence (capital letter, CJK character, or number)
    const startsLikeNewSentence = /^[A-Z\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u3000-\u303f\uff00-\uffef\d]/.test(lineTrimmed);
    
    return endsWithPunctuation && startsLikeNewSentence;
  }

  /**
   * PHASE 3.3: Enhanced OCR extraction using the orchestrator by default
   * This is a convenience method that enables the orchestrator for better performance
   */
  public static async extractTextWithOrchestrator(
    imageFile: File | Blob, 
    options: Omit<OCROptions, 'useOrchestrator'> = {}
  ): Promise<string> {
    return this.extractTextFromImage(imageFile, { ...options, useOrchestrator: true });
  }

  /**
   * PHASE 3.3: Check if orchestrator is available and working
   */
  public static async isOrchestratorAvailable(): Promise<boolean> {
    try {
      const health = await OCROrchestrator.getHealthStatus();
      return health.status === 'healthy' || health.status === 'degraded';
    } catch (error) {
      return false;
    }
  }

  /**
   * PHASE 3.3: Get orchestrator performance statistics
   */
  public static getOrchestratorStats() {
    try {
      return OCROrchestrator.getPerformanceStats();
    } catch (error) {
      return null;
    }
  }

  /**
   * PHASE 3.3: Get combined cache statistics (legacy + orchestrator)
   */
  public static getCombinedStats() {
    const legacyStats = this.getCacheStats();
    const orchestratorStats = this.getOrchestratorStats();
    
    return {
      legacy: legacyStats,
      orchestrator: orchestratorStats,
      combined: {
        totalWorkers: legacyStats.cachedWorkers + (orchestratorStats?.cacheStats?.cachedWorkers || 0),
        totalCacheHits: legacyStats.totalCacheHits + (orchestratorStats?.cacheStats?.totalCacheHits || 0)
      }
    };
  }

  /**
   * EMERGENCY: Force clear all workers due to configuration changes
   */
  public static async forceClearWorkers(): Promise<void> {
    await OCRCacheManager.forceClearAllWorkers();
  }

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
    
    // PHASE 3.3: Also cleanup orchestrator resources
    try {
      OCROrchestrator.cleanup();
      if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 Orchestrator resources cleaned up');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup orchestrator:', error);
    }
    
    if (DEV_CONFIG.DEBUGGING.OCR_DEBUG) console.log('🧹 All OCR workers terminated and caches cleared');
  }

  /**
   * Get a Tesseract worker for a specific language, leveraging caching.
   * This method is intended for use by background loaders or other services
   * that need direct access to a worker.
   */
  public static async getWorkerForLanguage(language: OCRLanguage): Promise<TesseractWorker> {
    return this.initializeWorker([language]);
  }
}

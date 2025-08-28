/**
 * Language Detection Service
 * 
 * Handles automatic detection of languages in OCR images based on
 * script analysis, word patterns, and statistical methods.
 */

import { OCRLanguage, OCROptions } from '../types/ocr-types';
import { OCRCacheManager } from './OCRCacheManager';
import { OCRErrorDetection, OCRErrorHandler, OCRErrorUtils } from '../utils/ocrErrorHandling';
import { createWorker } from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';

export class LanguageDetectionService {
  // SINGLE-PHASE OCR: Comprehensive worker for both detection and extraction
  private static comprehensiveWorker: { 
    worker: TesseractWorker; 
    lastUsed: number; 
    useCount: number; 
    languages: OCRLanguage[] 
  } | null = null;

  // Enhanced caching for combined results
  private static combinedCache: Map<string, {
    text: string;
    detectedLanguages: OCRLanguage[];
    timestamp: number;
    hitCount: number;
    extractionTime: number;
  }> = new Map();

  private static readonly COMBINED_CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_COMBINED_CACHE_ENTRIES = 50;

  /**
   * Quick pre-screening to avoid OCR entirely for obvious cases
   */
  public static async quickPreScreening(imageFile: File | Blob): Promise<OCRLanguage[] | null> {
    // Check filename patterns for language hints
    if (imageFile instanceof File) {
      const filename = imageFile.name.toLowerCase();

      // Chinese document patterns
      if (filename.includes('zh') || filename.includes('chinese') || filename.includes('中文')) {
        console.log('📁 Filename suggests Chinese, using chi_sim+chi_tra');
        return ['chi_sim', 'chi_tra'];
      }

      // Korean document patterns (check first to avoid "jp" in "korean" conflict)
      if (filename.includes('korean') || filename.includes('kr_') || filename.includes('_kr') || filename.includes('한국')) {
        console.log('📁 Filename suggests Korean, using kor');
        return ['kor'];
      }

      // Japanese document patterns  
      if (filename.includes('jp_') || filename.includes('_jp') || filename.includes('japanese') || filename.includes('日本')) {
        console.log('📁 Filename suggests Japanese, using jpn');
        return ['jpn'];
      }

      // Common European languages
      if (filename.includes('german') || filename.includes('deutsch') || filename.includes('de_') || filename.includes('_de')) {
        return ['deu'];
      }
      if (filename.includes('french') || filename.includes('français') || filename.includes('fr_') || filename.includes('_fr')) {
        return ['fra'];
      }
      if (filename.includes('spanish') || filename.includes('español') || filename.includes('es_') || filename.includes('_es')) {
        return ['spa'];
      }
    }

    // Quick image metadata check (if available)
    // Could check EXIF data, GPS location hints, etc. in future

    return null; // No quick determination possible
  }

  /**
   * SINGLE-PHASE OCR: Combined language detection and text extraction
   * This is the core method that restores 3be3ff2's accuracy while eliminating dual OCR passes
   * @param imageFile Image file to analyze
   * @param options OCR options including progress callbacks
   * @returns Combined result with text, detected languages, and extraction time
   */
  public static async extractTextWithLanguageDetection(
    imageFile: File | Blob,
    options: OCROptions & { onProgress?: (progress: number) => void } = {}
  ): Promise<{ text: string; detectedLanguages: OCRLanguage[]; extractionTime: number }> {
    console.log('🔍 Starting single-phase OCR (detection + extraction)...');

    // Quick pre-screening first (optimization from current approach)
    const quickResult = await this.quickPreScreening(imageFile);
    if (quickResult) {
      console.log('⚡ Quick pre-screening successful, but still need text extraction');
      // Even with quick languages, we need to extract text
      const extractionStart = Date.now();
      const worker = await this.initializeComprehensiveWorker(options.onProgress);
      const { data } = await worker.recognize(imageFile);
      const extractionTime = Date.now() - extractionStart;
      
      const processedText = this.postProcessText(data.text, quickResult);
      await this.storeCombinedCache(imageFile, processedText, quickResult, extractionTime);
      
      return { text: processedText, detectedLanguages: quickResult, extractionTime };
    }

    // Check combined cache first
    const cachedResult = await this.checkCombinedCache(imageFile);
    if (cachedResult) {
      console.log('🎯 Combined cache hit - returning both text and languages');
      return cachedResult;
    }

    try {
      if (options.onProgress) options.onProgress(0.05);

      // Initialize comprehensive worker (3be3ff2's proven 10-language approach)
      console.log('🔧 Initializing comprehensive OCR worker...');
      const worker = await this.initializeComprehensiveWorker((progress) => {
        if (options.onProgress) {
          options.onProgress(0.05 + (progress * 0.3)); // 5-35% for initialization
        }
      });

      if (options.onProgress) options.onProgress(0.35);

      // SINGLE PASS: Extract text using comprehensive worker
      console.log('📖 Extracting text with comprehensive language support...');
      const extractionStart = Date.now();
      
      const recognizePromise = worker.recognize(imageFile);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OCR recognition timeout')), 90000) // 90 second timeout
      );

      if (options.onProgress) options.onProgress(0.4);

      const { data } = await Promise.race([recognizePromise, timeoutPromise]);
      const extractionTime = Date.now() - extractionStart;

      if (options.onProgress) options.onProgress(0.8);

      console.log(`⏱️ Text extraction completed in ${extractionTime}ms`);

      // Analyze extracted text for language detection (3be3ff2's proven method)
      const extractedText = data.text;
      if (!extractedText || extractedText.trim().length === 0) {
        console.warn('⚠️ No text extracted, defaulting to English');
        const fallbackResult = {
          text: '',
          detectedLanguages: ['eng'] as OCRLanguage[],
          extractionTime
        };
        await this.storeCombinedCache(imageFile, '', ['eng'], extractionTime);
        return fallbackResult;
      }

      // RESTORED: Use 3be3ff2's proven text analysis method
      const detectedLanguages = this.analyzeTextForLanguages(extractedText);
      console.log('🎯 Languages detected from text analysis:', detectedLanguages);

      if (options.onProgress) options.onProgress(0.9);

      // Apply post-processing using detected languages
      const processedText = this.postProcessText(extractedText, detectedLanguages);
      
      if (options.onProgress) options.onProgress(1.0);

      // Store combined result in cache
      await this.storeCombinedCache(imageFile, processedText, detectedLanguages, extractionTime);

      console.log('✅ Single-phase OCR completed successfully');
      return {
        text: processedText,
        detectedLanguages,
        extractionTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Single-phase OCR failed:', errorMessage);

      // Enhanced error handling (preserve modern improvements)
      const errorCategory = OCRErrorDetection.categorizeError(error);
      OCRErrorHandler.logError('single-phase OCR', error, {
        imageFileSize: imageFile.size,
        imageFileType: imageFile.type || 'unknown'
      });

      // Return safe fallback
      const fallbackResult = {
        text: '',
        detectedLanguages: OCRErrorUtils.createFallbackLanguages() as OCRLanguage[],
        extractionTime: 0
      };

      return fallbackResult;
    }
  }

  /**
   * Initialize comprehensive worker for single-phase OCR
   * Restores 3be3ff2's proven 10-language comprehensive approach
   */
  private static async initializeComprehensiveWorker(onProgress?: (progress: number) => void): Promise<TesseractWorker> {
    // Check cache first
    if (this.comprehensiveWorker) {
      this.comprehensiveWorker.lastUsed = Date.now();
      this.comprehensiveWorker.useCount++;
      console.log(`🎯 Comprehensive worker cache hit (used ${this.comprehensiveWorker.useCount} times)`);
      return this.comprehensiveWorker.worker;
    }

    console.log('🔄 Creating new comprehensive OCR worker...');
    
    // RESTORED: 3be3ff2's exact comprehensive language set
    const comprehensiveLanguages: OCRLanguage[] = ['eng', 'chi_sim', 'chi_tra', 'spa', 'fra', 'deu', 'jpn', 'kor', 'ara', 'rus'];
    
    console.log('🌐 Comprehensive worker languages:', comprehensiveLanguages.map(lang => lang).join(', '));

    // Configure paths for offline/Electron mode
    const workerConfig: any = {
      logger: this.createLogger()
    };

    // Use local assets if in Electron or offline mode
    if (typeof window !== 'undefined' && (window as any).TESSERACT_CONFIG) {
      const config = (window as any).TESSERACT_CONFIG;
      workerConfig.langPath = config.langPath || './tessdata/';
      workerConfig.corePath = config.corePath || './tesseract/';
      workerConfig.workerPath = config.workerPath || './tesseract/worker.min.js';
      console.log('🔧 Using local Tesseract assets for comprehensive worker');
    }

    const worker = await createWorker(comprehensiveLanguages, 1, workerConfig);

    // Cache the comprehensive worker
    this.comprehensiveWorker = {
      worker,
      lastUsed: Date.now(),
      useCount: 1,
      languages: comprehensiveLanguages
    };

    console.log('✅ Comprehensive OCR worker initialized and cached');
    return worker;
  }

  /**
   * Check combined cache for both text and language results
   */
  private static async checkCombinedCache(imageFile: File | Blob): Promise<{
    text: string;
    detectedLanguages: OCRLanguage[];
    extractionTime: number;
  } | null> {
    try {
      const cacheKey = await this.generateCacheKey(imageFile);
      const cached = this.combinedCache.get(cacheKey);

      if (cached) {
        const now = Date.now();
        if (now - cached.timestamp < this.COMBINED_CACHE_EXPIRY_MS) {
          cached.hitCount++;
          console.log(`🎯 Combined cache hit (hit #${cached.hitCount})`);
          return {
            text: cached.text,
            detectedLanguages: cached.detectedLanguages,
            extractionTime: cached.extractionTime
          };
        } else {
          this.combinedCache.delete(cacheKey);
          console.log('⏰ Combined cache entry expired');
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to check combined cache:', error);
      return null;
    }
  }

  /**
   * Store combined result in cache
   */
  private static async storeCombinedCache(
    imageFile: File | Blob,
    text: string,
    detectedLanguages: OCRLanguage[],
    extractionTime: number
  ): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(imageFile);

      this.combinedCache.set(cacheKey, {
        text,
        detectedLanguages: [...detectedLanguages], // Clone array
        timestamp: Date.now(),
        hitCount: 0,
        extractionTime
      });

      console.log('💾 Combined result cached for future use');

      // Cleanup if cache is too large
      if (this.combinedCache.size > this.MAX_COMBINED_CACHE_ENTRIES) {
        this.cleanupCombinedCache();
      }
    } catch (error) {
      console.warn('Failed to store combined cache:', error);
    }
  }

  /**
   * Generate cache key for combined results
   */
  private static async generateCacheKey(imageFile: File | Blob): Promise<string> {
    const size = imageFile.size;

    if (imageFile instanceof File) {
      const modifiedDate = imageFile.lastModified || 0;
      const name = imageFile.name || 'unknown';
      return `combined_${size}_${modifiedDate}_${name}`;
    } else {
      // For Blob objects: use size + content hash
      const arrayBuffer = await imageFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
      return `combined_blob_${size}_${hashHex}`;
    }
  }

  /**
   * Cleanup combined cache
   */
  private static cleanupCombinedCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.combinedCache.entries()) {
      if (now - entry.timestamp > this.COMBINED_CACHE_EXPIRY_MS) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.combinedCache.delete(key);
    }

    // If still too large, remove least recently used
    if (this.combinedCache.size > this.MAX_COMBINED_CACHE_ENTRIES) {
      const sortedEntries = Array.from(this.combinedCache.entries())
        .sort(([, a], [, b]) => {
          if (a.hitCount !== b.hitCount) {
            return a.hitCount - b.hitCount;
          }
          return a.timestamp - b.timestamp;
        });

      const toRemove = sortedEntries.slice(0, this.combinedCache.size - this.MAX_COMBINED_CACHE_ENTRIES);
      for (const [key] of toRemove) {
        this.combinedCache.delete(key);
      }
    }

    console.log(`🧹 Combined cache cleaned up, ${this.combinedCache.size} entries remaining`);
  }

  /**
   * Post-process text using detected languages
   */
  private static postProcessText(text: string, detectedLanguages: OCRLanguage[]): string {
    // RESTORED: Use 3be3ff2's capability-based language selection for post-processing
    const primaryLanguage = this.selectPrimaryLanguage(detectedLanguages);
    console.log('🧘 Post-processing with primary language:', primaryLanguage);

    // Apply basic universal preservation (keep current enhancements)
    let processed = this.gentleUniversalPreservation(text);

    // Remove single spaces between CJK characters (3be3ff2's approach)
    const cjk = '[\\u4e00-\\u9fff\\u3400-\\u4dbf\\uf900-\\ufaff\\u3040-\\u309f\\u30a0-\\u30ff\\uac00-\\ud7af\\u3000-\\u303f\\uff00-\\uffef]';
    const cjkSpaceRegex = new RegExp(`(${cjk}) (${cjk})`, 'g');
    let previousText;
    do {
      previousText = processed;
      processed = processed.replace(cjkSpaceRegex, '$1$2');
    } while (processed !== previousText);

    return processed;
  }

  /**
   * RESTORED: 3be3ff2's capability-based primary language selection
   */
  private static selectPrimaryLanguage(detectedLanguages: OCRLanguage[]): OCRLanguage {
    // RESTORED: 3be3ff2's exact capability-based priority
    const capabilityPriority: OCRLanguage[] = [
      'chi_sim', 'chi_tra', 'jpn', 'kor', 'ara', 'rus', // Complex scripts first
      'eng', 'fra', 'deu', 'spa' // Latin scripts
    ];

    for (const lang of capabilityPriority) {
      if (detectedLanguages.includes(lang)) {
        console.log(`🎯 Primary language selected: ${lang} from detected: [${detectedLanguages.join(', ')}]`);
        return lang;
      }
    }

    console.log(`🔄 No priority language found, defaulting to English from: [${detectedLanguages.join(', ')}]`);
    return 'eng';
  }

  /**
   * Universal text preservation (basic cleanup)
   */
  private static gentleUniversalPreservation(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .trim();
  }

  /**
   * Logger for Tesseract operations
   */
  private static createLogger() {
    return (m: any) => {
      // Suppress most logging to reduce console noise, show progress for important operations
      if (m.status === 'recognizing text' && m.progress) {
        console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
      }
    };
  }

  /**
   * Detects languages in the provided image file using OSD (Orientation & Script Detection)
   * @param imageFile Image file to analyze
   * @param onProgress Optional progress callback for initialization feedback
   */
  public static async detectLanguage(imageFile: File | Blob, onProgress?: (progress: number) => void): Promise<OCRLanguage[]> {
    console.log('🔍 Starting OSD-based language detection...');

    // OPTIMIZATION: Try quick pre-screening first
    const quickResult = await this.quickPreScreening(imageFile);
    if (quickResult) {
      console.log('⚡ Quick pre-screening successful, skipping OSD detection');
      // Cache the quick result
      await OCRCacheManager.storeLanguageCache(imageFile, quickResult);
      return quickResult;
    }

    // Check cache first
    const cachedResult = await OCRCacheManager.checkLanguageCache(imageFile);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Use OSD detection worker with detailed progress feedback
      console.log('🔧 Initializing OSD detection worker...');
      
      // Report worker initialization progress (0-60% of total)
      const worker = await OCRCacheManager.initializeDetectionWorker((progress) => {
        if (onProgress) {
          const scaledProgress = progress * 0.6; // First 60% is worker initialization
          onProgress(scaledProgress);
        }
      });
      
      if (onProgress) {
        onProgress(0.6);
      }

      console.log('📖 Running OSD detection...');
      const detectionStart = Date.now();
      
      if (onProgress) {
        onProgress(0.65);
      }

      // CRITICAL OPTIMIZATION: Use OSD (Orientation & Script Detection) instead of full OCR
      // OSD is 10x faster than full OCR for language detection
      let osdResult: any;
      try {
        console.log('🔍 Attempting OSD detection...');
        
        // STANDARDIZED: Validate worker using standardized error handling
        if (!OCRErrorHandler.validateWorker(worker, ['detect'])) {
          throw new Error('Worker is invalid or does not support detect method');
        }
        
        const osdPromise = worker.detect(imageFile);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('OSD detection timeout')), 60000) // Increased timeout to 60 seconds
        );
        
        osdResult = await Promise.race([osdPromise, timeoutPromise]);
        
        if (onProgress) {
          onProgress(0.9);
        }
        console.log('✅ OSD detection successful');
      } catch (error) {
        OCRErrorHandler.logError('OSD detection', error, { 
          imageFileSize: imageFile.size,
          imageFileType: imageFile.type || 'unknown'
        });
        
        // STANDARDIZED FALLBACK: Handle errors using categorized error handling
        const errorCategory = OCRErrorDetection.categorizeError(error);
        
        if (errorCategory.isRecoverable && (
            OCRErrorDetection.isLegacyError(error) ||
            OCRErrorDetection.isWorkerValidationError(error)
        )) {
          console.log(`🔄 ${errorCategory.recommendedAction}`);
          const fallbackLanguages = OCRErrorUtils.createFallbackLanguages() as OCRLanguage[];
          await OCRCacheManager.storeLanguageCache(imageFile, fallbackLanguages);
          
          if (onProgress) {
            onProgress(1.0); // Complete the progress
          }
          
          return fallbackLanguages;
        }
        
        throw error;
      }

      const detectionTime = Date.now() - detectionStart;
      console.log(`⏱️ OSD detection completed in ${detectionTime}ms`);

      // Extract script information from OSD result
      const scriptData = osdResult.data;
      if (!scriptData || !scriptData.script) {
        console.warn('⚠️ No script data extracted from OSD, defaulting to English');
        const fallbackLanguages = ['eng'] as OCRLanguage[];
        await OCRCacheManager.storeLanguageCache(imageFile, fallbackLanguages);
        return fallbackLanguages;
      }

      console.log('🔍 Analyzing OSD script data:', scriptData);
      
      // DEBUG: Check all confidence values available
      console.log('🔍 DEBUG OSD Confidence Values:', {
        script_confidence: scriptData.script_confidence,
        orientation_confidence: scriptData.orientation_confidence,
        script: scriptData.script,
        orientation_degrees: scriptData.orientation_degrees
      });
      
      const detectedLanguages = this.mapScriptToLanguages(scriptData);

      console.log('🎯 Final detected languages from OSD:', detectedLanguages);
      
      if (onProgress) {
        onProgress(0.95);
      }

      // Store result in cache
      await OCRCacheManager.storeLanguageCache(imageFile, detectedLanguages);
      
      if (onProgress) {
        onProgress(1.0);
      }

      return detectedLanguages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ OSD language detection failed:', errorMessage);

      // STANDARDIZED ERROR HANDLING: Use centralized error categorization and logging
      const errorCategory = OCRErrorDetection.categorizeError(error);
      
      OCRErrorHandler.logError('language detection', error, {
        imageFileSize: imageFile.size,
        imageFileType: imageFile.type || 'unknown',
        isTauri: typeof window !== 'undefined' && (window as any).__TAURI__,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown'
      });

      const fallbackLanguages = OCRErrorUtils.createFallbackLanguages() as OCRLanguage[];

      // Store fallback result in cache to avoid repeated failures
      await OCRCacheManager.storeLanguageCache(imageFile, fallbackLanguages);

      return fallbackLanguages;
    }
  }

  /**
   * Maps OSD script detection results to OCR language codes
   * @param scriptData OSD script detection data from Tesseract.js
   * @returns Array of detected language codes based on script
   */
  private static mapScriptToLanguages(scriptData: any): OCRLanguage[] {
    const languages: OCRLanguage[] = [];
    
    if (!scriptData || !scriptData.script) {
      return ['eng'] as OCRLanguage[];
    }

    // Map Tesseract.js script codes to our OCR language codes
    const script = scriptData.script.toLowerCase();
    const confidence = scriptData.script_confidence || 0;
    
    // IMPROVED: More flexible confidence handling
    if (confidence < 10) {
      console.warn(`⚠️ Very low confidence OSD detection (${confidence}%), defaulting to English`);
      return ['eng'] as OCRLanguage[];
    } else if (confidence < 30) {
      console.warn(`⚠️ Low confidence OSD detection (${confidence}%), but proceeding with detected script`);
      // Continue with detection but add English as fallback
    }

    console.log(`🔤 OSD Script detected: ${script} (confidence: ${confidence}%)`);

    // Map common script codes to language codes
    const scriptToLanguageMap: Record<string, OCRLanguage[]> = {
      'Han': ['chi_sim', 'chi_tra', 'jpn', 'kor'],
      'Hani': ['chi_sim', 'chi_tra', 'jpn', 'kor'],
      'HanS': ['chi_sim'],
      'HanT': ['chi_tra'],
      'Hiragana': ['jpn'],
      'Katakana': ['jpn'],
      'Hangul': ['kor'],
      'Latin': ['eng', 'spa', 'fra', 'deu'],
      'Cyrillic': ['rus'],
      'Arabic': ['ara'],
      'Devanagari': ['hin'],
      'Thai': ['tha'],
      'Greek': ['ell'],
      'Hebrew': ['heb']
    };

    // Handle specific script patterns
    if (script.includes('han') || script.includes('chinese')) {
      // For Han script, we need to determine simplified vs traditional
      // Default to both for better OCR coverage
      languages.push('chi_sim', 'chi_tra');
    } else if (script.includes('japanese') || script.includes('hiragana') || script.includes('katakana')) {
      languages.push('jpn');
    } else if (script.includes('korean') || script.includes('hangul')) {
      languages.push('kor');
    } else if (script.includes('arabic')) {
      languages.push('ara');
    } else if (script.includes('cyrillic')) {
      languages.push('rus');
    } else if (script.includes('latin')) {
      // For Latin script, include common European languages
      languages.push('eng', 'spa', 'fra', 'deu');
    } else if (script.includes('devanagari')) {
      languages.push('hin');
    } else if (script.includes('thai')) {
      languages.push('tha');
    } else if (script.includes('greek')) {
      languages.push('ell');
    } else if (script.includes('hebrew')) {
      languages.push('heb');
    } else {
      // Fallback to English for unknown scripts
      console.warn(`⚠️ Unknown script: ${script}, defaulting to English`);
      languages.push('eng');
    }

    // Remove duplicates and ensure we have at least English
    const uniqueLanguages = [...new Set(languages)];
    if (uniqueLanguages.length === 0) {
      uniqueLanguages.push('eng');
    }

    // IMPROVED: For low confidence detections, always include English as primary fallback
    if (confidence < 30 && !uniqueLanguages.includes('eng')) {
      uniqueLanguages.unshift('eng'); // Add English as first language for better reliability
      console.log('🔄 Added English as primary language due to low confidence detection');
    }

    return uniqueLanguages;
  }

  /**
   * Analyzes text content to determine probable languages
   */
  private static analyzeTextForLanguages(text: string): OCRLanguage[] {
    const detectedLanguages: OCRLanguage[] = [];

    // Enhanced text-based language detection
    // Check for non-Latin scripts first (these are easier to identify)
    if (this.containsChinese(text)) {
      if (this.isTraditionalChinese(text)) {
        detectedLanguages.push('chi_tra');
      } else {
        detectedLanguages.push('chi_sim');
      }
      console.log('✅ Chinese script detected');
    }

    if (this.containsJapanese(text)) {
      detectedLanguages.push('jpn');
      console.log('✅ Japanese script detected');
    }

    if (this.containsKorean(text)) {
      detectedLanguages.push('kor');
      console.log('✅ Korean script detected');
    }

    if (this.containsArabic(text)) {
      detectedLanguages.push('ara');
      console.log('✅ Arabic script detected');
    }

    // PRIORITY FIX: Check Latin-based languages first, then Cyrillic
    // This prioritizes English over Russian for ambiguous cases
    let hasLatinLanguage = false;

    // Check for English first with strong indicators
    if (this.containsEnglish(text)) {
      detectedLanguages.push('eng');
      hasLatinLanguage = true;
      console.log('✅ English detected based on common words and patterns');
    }

    // Check for Spanish (has unique characters)
    if (this.containsSpanish(text)) {
      detectedLanguages.push('spa');
      hasLatinLanguage = true;
      console.log('✅ Spanish detected based on unique characters and patterns');
    }

    // Check for French
    if (this.containsFrench(text)) {
      detectedLanguages.push('fra');
      hasLatinLanguage = true;
      console.log('✅ French detected based on unique characters and patterns');
    }

    // Check for German
    if (this.containsGerman(text)) {
      detectedLanguages.push('deu');
      hasLatinLanguage = true;
      console.log('✅ German detected based on unique characters and patterns');
    }

    // ENHANCED RUSSIAN DETECTION: Only add Russian if we have strong Cyrillic evidence
    // AND either no Latin language was detected OR it's clearly a mixed-script document
    if (this.containsCyrillic(text)) {
      if (!hasLatinLanguage) {
        // Pure Cyrillic document - definitely Russian
        detectedLanguages.push('rus');
        console.log('✅ Russian detected - pure Cyrillic text with no Latin languages');
      } else {
        // Mixed script - only add Russian if we have substantial Cyrillic content
        const cyrillicChars = text.match(/[АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя]/g);
        const totalChars = text.replace(/\s/g, '').length;
        const cyrillicRatio = cyrillicChars ? cyrillicChars.length / totalChars : 0;

        if (cyrillicRatio > 0.1) { // At least 10% Cyrillic characters
          detectedLanguages.push('rus');
          console.log(`✅ Russian added to mixed-script document (${Math.round(cyrillicRatio * 100)}% Cyrillic)`);
        } else {
          console.log(`⚠️ Cyrillic detected but ratio too low (${Math.round(cyrillicRatio * 100)}%) - skipping Russian`);
        }
      }
    }

    // If no languages detected at all, default to English
    if (detectedLanguages.length === 0) {
      detectedLanguages.push('eng');
      console.log('🔍 Defaulting to English - no specific language patterns detected');
    }

    // Always include English as fallback for mixed documents (unless it's already primary)
    if (!detectedLanguages.includes('eng') && detectedLanguages.length > 0) {
      detectedLanguages.push('eng');
    }

    return detectedLanguages;
  }

  /**
   * Checks if text contains Chinese characters
   */
  private static containsChinese(text: string): boolean {
    return /[\u4e00-\u9fff]/.test(text);
  }

  /**
   * Determines if Chinese text is Traditional vs Simplified
   */
  private static isTraditionalChinese(text: string): boolean {
    // Common traditional Chinese characters not used in simplified
    const traditionalChars = /[繁體中文台灣香港澳門]/;
    return traditionalChars.test(text);
  }

  /**
   * Checks if text contains Japanese characters
   */
  private static containsJapanese(text: string): boolean {
    // Hiragana, Katakana, and Japanese-specific Kanji
    return /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
  }

  /**
   * Checks if text contains Korean characters
   */
  private static containsKorean(text: string): boolean {
    // Hangul syllables
    return /[\uac00-\ud7af]/.test(text);
  }

  /**
   * Checks if text contains Arabic characters
   */
  private static containsArabic(text: string): boolean {
    // Arabic script
    return /[\u0600-\u06ff]/.test(text);
  }

  /**
   * Checks if text contains Cyrillic characters
   */
  private static containsCyrillic(text: string): boolean {
    // ENHANCED: More precise Cyrillic detection to prevent false positives
    // Only match actual Cyrillic letters, not extended symbols that might be confused
    const cyrillicLetters = /[АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя]/;

    // Check for actual Cyrillic characters
    const hasBasicCyrillic = cyrillicLetters.test(text);

    if (hasBasicCyrillic) {
      // Count Cyrillic characters to ensure it's not just OCR noise
      const cyrillicMatches = text.match(/[АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя]/g);
      const cyrillicCount = cyrillicMatches ? cyrillicMatches.length : 0;

      console.log('🔍 Cyrillic analysis:', {
        hasBasicCyrillic,
        cyrillicCount,
        sample: cyrillicMatches?.slice(0, 10)
      });

      // Require at least 3 Cyrillic characters to avoid false positives
      return cyrillicCount >= 3;
    }

    return false;
  }

  /**
   * Enhanced English detection
   */
  private static containsEnglish(text: string): boolean {
    // Common English words that are unlikely to appear in other languages
    const englishWords = /\b(the|and|that|have|for|not|with|you|this|but|his|from|they|she|her|been|than|its|who|did|get|may|him|old|see|now|way|could|people|my|than|first|water|been|call|who|oil|sit|now|find|long|down|day|did|get|come|made|may|part)\b/gi;

    const englishMatches = text.match(englishWords);
    if (englishMatches && englishMatches.length >= 3) {
      console.log('🔍 English words found:', englishMatches.slice(0, 5));
      return true;
    }

    // English-specific patterns
    const englishPatterns = [
      /\b(ing|tion|ness|ment|able|ible)\b/gi,  // Common English suffixes
      /\b(un|re|pre|dis|mis|over|under|out)\w+/gi,  // Common English prefixes
      /\b(I|I'm|I've|I'll|I'd|you're|we're|they're|it's|that's|what's|where's|how's)\b/gi,  // English contractions
    ];

    for (const pattern of englishPatterns) {
      if (pattern.test(text)) {
        console.log('🔍 English patterns found');
        return true;
      }
    }

    // Check for typical English legal/business terms (relevant for your use case)
    const legalEnglish = /\b(party|parties|agreement|contract|shall|whereas|therefore|pursuant|herein|thereof|hereof|witnesseth|consideration|covenant|provision|section|paragraph|clause|article|schedule|exhibit|attachment|addendum|amendment|modification|termination|breach|default|remedy|damages|liability|indemnify|represent|warrant|acknowledge|certify|execute|deliver|effective|binding|enforceable|jurisdiction|governing|applicable|compliance|performance|obligation|responsibility|authority|capacity|power|right|title|interest|ownership|possession|control|management|operation|maintenance|repair|replacement|improvement|development|construction|installation|implementation|completion|delivery|acceptance|approval|consent|permission|authorization|license|permit|registration|filing|recording|notice|notification|communication|correspondence|document|instrument|certificate|statement|report|disclosure|representation|warranty|guarantee|assurance|confirmation|verification|validation|authentication|identification|designation|appointment|nomination|selection|election|determination|decision|resolution|conclusion|settlement|compromise|mediation|arbitration|litigation|dispute|controversy|claim|demand|request|application|petition|motion|pleading|brief|memorandum|opinion|order|judgment|decree|award|ruling|finding|holding|precedent|authority|citation|reference|source|basis|ground|reason|cause|purpose|objective|goal|intent|intention|meaning|interpretation|construction|understanding|knowledge|awareness|notice|information|data|fact|evidence|proof|documentation|record|file|archive|database|system|process|procedure|method|technique|approach|strategy|plan|program|project|initiative|effort|activity|action|step|measure|requirement|condition|term|provision|stipulation|specification|standard|criterion|benchmark|guideline|policy|rule|regulation|law|statute|ordinance|code|act|bill|legislation|enactment|promulgation|publication|issuance|adoption|implementation|enforcement|compliance|violation|infringement|breach|default|failure|omission|neglect|misconduct|malpractice|negligence|fault|error|mistake|defect|deficiency|inadequacy|insufficiency|shortage|lack|absence|unavailability|inaccessibility|impossibility|impracticability|unfeasibility|difficulty|complexity|complication|obstacle|barrier|impediment|hindrance|interference|disruption|interruption|suspension|delay|postponement|extension|renewal|continuation|resumption|restoration|recovery|rehabilitation|reconstruction|renovation|modernization|upgrade|enhancement|improvement|optimization|efficiency|effectiveness|productivity|performance|quality|excellence|superiority|advantage|benefit|value|worth|importance|significance|relevance|applicability|suitability|appropriateness|adequacy|sufficiency|completeness|thoroughness|comprehensiveness|accuracy|precision|correctness|validity|reliability|credibility|trustworthiness|integrity|honesty|transparency|openness|disclosure|accountability|responsibility|liability|culpability|blame|fault|guilt|innocence|exoneration|vindication|justification|excuse|defense|protection|security|safety|risk|danger|hazard|threat|vulnerability|exposure|susceptibility|immunity|resistance|tolerance|acceptance|approval|endorsement|support|backing|sponsorship|patronage|advocacy|promotion|encouragement|assistance|aid|help|cooperation|collaboration|partnership|alliance|association|affiliation|membership|participation|involvement|engagement|commitment|dedication|devotion|loyalty|faithfulness|fidelity|allegiance|obedience|compliance|conformity|adherence|observance|respect|regard|consideration|attention|focus|concentration|emphasis|priority|preference|choice|selection|option|alternative|possibility|opportunity|chance|prospect|potential|capability|capacity|ability|skill|talent|expertise|experience|knowledge|understanding|comprehension|awareness|consciousness|recognition|acknowledgment|admission|confession|declaration|statement|assertion|claim|allegation|accusation|charge|complaint|grievance|objection|protest|opposition|resistance|refusal|rejection|denial|contradiction|dispute|disagreement|conflict|controversy|debate|discussion|negotiation|bargaining|compromise|settlement|resolution|solution|answer|response|reply|reaction|feedback|comment|remark|observation|note|annotation|explanation|clarification|interpretation|translation|conversion|transformation|change|modification|alteration|adjustment|adaptation|accommodation|customization|personalization|individualization|specialization|differentiation|distinction|discrimination|separation|division|classification|categorization|organization|arrangement|structure|framework|system|model|pattern|design|plan|blueprint|scheme|strategy|approach|method|technique|procedure|process|operation|function|activity|task|job|work|labor|effort|endeavor|undertaking|venture|enterprise|business|company|corporation|organization|institution|establishment|entity|body|group|team|committee|board|council|assembly|meeting|conference|convention|symposium|seminar|workshop|training|education|instruction|teaching|learning|study|research|investigation|inquiry|examination|analysis|evaluation|assessment|appraisal|review|audit|inspection|survey|poll|questionnaire|interview|consultation|discussion|conversation|dialogue|communication|correspondence|exchange|interaction|relationship|connection|association|link|tie|bond|attachment|affiliation|membership|participation|involvement|engagement|commitment|obligation|duty|responsibility|accountability|liability|culpability|blame|fault|guilt|innocence|exoneration|vindication|justification|excuse|defense|protection|security|safety|risk|danger|hazard|threat|vulnerability|exposure|susceptibility|immunity|resistance|tolerance|acceptance|approval|endorsement|support|backing|sponsorship|patronage|advocacy|promotion|encouragement|assistance|aid|help|cooperation|collaboration|partnership|alliance)\b/gi;

    if (legalEnglish.test(text)) {
      console.log('🔍 English legal/business terms found');
      return true;
    }

    return false;
  }

  /**
   * Enhanced Spanish detection
   */
  private static containsSpanish(text: string): boolean {
    // Spanish-specific characters
    const spanishChars = /[ñáéíóúüÑÁÉÍÓÚÜ¿¡]/;
    if (spanishChars.test(text)) {
      console.log('🔍 Spanish characters found:', text.match(spanishChars));
      return true;
    }

    // Common Spanish words and patterns
    const spanishWords = /\b(el|la|los|las|de|del|en|con|por|para|que|es|son|está|están|tiene|tienen|hace|hacen|muy|más|también|pero|como|cuando|donde|porque|aunque|desde|hasta|entre|sobre|bajo|durante|después|antes|mientras|según|sin|contra|hacia|mediante|salvo|excepto|incluso|además|sino|sólo|solo|cada|todo|toda|todos|todas|otro|otra|otros|otras|mismo|misma|mismos|mismas|cual|cuales|quien|quienes|cuyo|cuya|cuyos|cuyas)\b/gi;

    const spanishMatches = text.match(spanishWords);
    if (spanishMatches && spanishMatches.length >= 3) {
      console.log('🔍 Spanish words found:', spanishMatches.slice(0, 5));
      return true;
    }

    // Spanish-specific punctuation patterns
    const spanishPunctuation = /[¿¡]/;
    if (spanishPunctuation.test(text)) {
      console.log('🔍 Spanish punctuation found');
      return true;
    }

    return false;
  }

  /**
   * Enhanced French detection
   */
  private static containsFrench(text: string): boolean {
    // French-specific characters
    const frenchChars = /[àâäçéèêëïîôöùûüÿæœÀÂÄÇÉÈÊËÏÎÔÖÙÛÜŸÆŒ]/;
    if (frenchChars.test(text)) {
      console.log('🔍 French characters found:', text.match(frenchChars));
      return true;
    }

    // Common French words and patterns
    const frenchWords = /\b(le|la|les|de|du|des|un|une|et|est|sont|avec|dans|pour|par|sur|sous|entre|vers|chez|sans|contre|pendant|après|avant|depuis|jusqu|jusque|selon|malgré|sauf|hormis|outre|parmi|moyennant|concernant|touchant|suivant|durant|lors|dès|via|envers|devers|que|qui|dont|où|quand|comment|pourquoi|combien|lequel|laquelle|lesquels|lesquelles|auquel|auxquels|duquel|desquels|ce|cette|ces|cet|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs)\b/gi;

    const frenchMatches = text.match(frenchWords);
    if (frenchMatches && frenchMatches.length >= 3) {
      console.log('🔍 French words found:', frenchMatches.slice(0, 5));
      return true;
    }

    // French-specific contractions and patterns
    const frenchPatterns = /\b(c'est|d'un|d'une|l'|qu'|n'|s'|t'|j'|m')\b/gi;
    if (frenchPatterns.test(text)) {
      console.log('🔍 French patterns found');
      return true;
    }

    return false;
  }

  /**
   * Enhanced German detection
   */
  private static containsGerman(text: string): boolean {
    // German-specific characters
    const germanChars = /[äöüßÄÖÜ]/;
    if (germanChars.test(text)) {
      console.log('🔍 German characters found:', text.match(germanChars));
      return true;
    }

    // Common German words and patterns
    const germanWords = /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|und|oder|aber|doch|jedoch|sondern|denn|weil|da|wenn|als|wie|wo|wohin|woher|wann|warum|weshalb|wieso|weswegen|wodurch|womit|wofür|wogegen|worüber|worauf|worin|wozu|von|zu|mit|nach|bei|in|an|auf|über|unter|vor|hinter|neben|zwischen|durch|für|gegen|ohne|um|während|wegen|trotz|statt|anstatt|außer|bis|seit|ab|aus|binnen|dank|entlang|entsprechend|gemäß|laut|mangels|mittels|nebst|samt|seitens|ungeachtet|unweit|zufolge|zugunsten|zulasten|zwecks|ist|sind|war|waren|hat|haben|hatte|hatten|wird|werden|wurde|wurden|kann|können|konnte|konnten|soll|sollen|sollte|sollten|will|wollen|wollte|wollten|mag|mögen|mochte|mochten|darf|dürfen|durfte|durften|muss|müssen|musste|mussten)\b/gi;

    const germanMatches = text.match(germanWords);
    if (germanMatches && germanMatches.length >= 3) {
      console.log('🔍 German words found:', germanMatches.slice(0, 5));
      return true;
    }

    // German compound words (characteristic long words)
    const germanCompounds = /\b\w{12,}\b/g;
    const longWords = text.match(germanCompounds);
    if (longWords && longWords.length >= 2) {
      console.log('🔍 German compound words found:', longWords.slice(0, 3));
      return true;
    }

    return false;
  }
}
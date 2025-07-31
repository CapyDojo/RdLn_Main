/**
 * Language Detection Service
 * 
 * Handles automatic detection of languages in OCR images based on
 * script analysis, word patterns, and statistical methods.
 */

import { OCRLanguage } from '../types/ocr-types';
import { OCRCacheManager } from './OCRCacheManager';

export class LanguageDetectionService {
  
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
   * Detects languages in the provided image file
   */
  public static async detectLanguage(imageFile: File | Blob): Promise<OCRLanguage[]> {
    console.log('🔍 Starting language detection...');
    
    // OPTIMIZATION: Try quick pre-screening first
    const quickResult = await this.quickPreScreening(imageFile);
    if (quickResult) {
      console.log('⚡ Quick pre-screening successful, skipping full detection');
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
      // Use multi-language detection worker for comprehensive language support
      const worker = await OCRCacheManager.initializeDetectionWorker();
      
      console.log('📖 Running detection OCR with full language support...');
      const detectionStart = Date.now();
      
      // Perform OCR with all supported languages
      const { data } = await worker.recognize(imageFile);
      
      const detectionTime = Date.now() - detectionStart;
      console.log(`⏱️ Detection OCR completed in ${detectionTime}ms`);
      
      // Extract text for analysis
      const text = data.text;
      console.log('🔍 Analyzing text for language detection:', text.substring(0, 200) + '...');
      
      const detectedLanguages = this.analyzeTextForLanguages(text);
      
      console.log('🎯 Final detected languages:', detectedLanguages);
      
      // Store result in cache
      await OCRCacheManager.storeLanguageCache(imageFile, detectedLanguages);
      
      return detectedLanguages;
    } catch (error) {
      console.warn('Language detection failed, defaulting to English:', error);
      const fallbackLanguages = ['eng'] as OCRLanguage[];
      
      // Store fallback result in cache to avoid repeated failures
      await OCRCacheManager.storeLanguageCache(imageFile, fallbackLanguages);
      
      return fallbackLanguages;
    }
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
    
    if (this.containsCyrillic(text)) {
      detectedLanguages.push('rus');
      console.log('✅ Cyrillic/Russian script detected');
    }
    
    // If no non-Latin script detected, check for Latin-based languages
    if (detectedLanguages.length === 0) {
      // Check for Spanish first (has unique characters)
      if (this.containsSpanish(text)) {
        detectedLanguages.push('spa');
        console.log('✅ Spanish detected based on unique characters and patterns');
      }
      
      // Check for French
      if (this.containsFrench(text)) {
        detectedLanguages.push('fra');
        console.log('✅ French detected based on unique characters and patterns');
      }
      
      // Check for German
      if (this.containsGerman(text)) {
        detectedLanguages.push('deu');
        console.log('✅ German detected based on unique characters and patterns');
      }
      
      // If no specific Latin language detected, default to English
      if (detectedLanguages.length === 0) {
        detectedLanguages.push('eng');
        console.log('🔍 Defaulting to English - no specific language patterns detected');
      }
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
    // Cyrillic script
    return /[\u0400-\u04ff]/.test(text);
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
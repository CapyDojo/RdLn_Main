/**
 * OCR Text Cleanup Service
 * 
 * Handles multi-language text post-processing for OCR results.
 * Extracted from monolithic OCRService for focused responsibility.
 * 
 * Features:
 * - Language-specific text cleaning
 * - Character error correction
 * - Punctuation normalization
 * - Legal terminology fixes
 * - Intelligent paragraph reconstruction
 */

import { OCRLanguage } from '../types/ocr-types';
import { SUPPORTED_LANGUAGES } from '../config/ocrConfig';
import { appConfig } from '../config/appConfig';
import { 
  safeAsync, 
  ErrorCategory, 
  ErrorFactory 
} from '../utils/errorHandling';

export interface TextProcessingOptions {
  preserveParagraphs?: boolean;
  applyLegalTermFixes?: boolean;
  enhancedPunctuation?: boolean;
  language?: OCRLanguage;
}

export interface ProcessingResult {
  processedText: string;
  processingTime: number;
  language: OCRLanguage;
  appliedProcessors: string[];
}

export class OCRTextCleanupService {

  /**
   * Main entry point for text processing
   */
  public static async processText(
    text: string, 
    languages: OCRLanguage[], 
    options: TextProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    const appliedProcessors: string[] = [];

    try {
      // Determine primary language for processing
      const primaryLanguage = this.selectPrimaryLanguage(languages);
      appliedProcessors.push(`primary-language-${primaryLanguage}`);

      let processedText = text;

      // Apply language-specific processing
      if (this.isCJKLanguage(primaryLanguage)) {
        processedText = this.processCJKText(processedText, primaryLanguage);
        appliedProcessors.push(`cjk-processing-${primaryLanguage}`);
      } else if (this.isEuropeanLanguage(primaryLanguage)) {
        processedText = this.processEuropeanText(processedText, primaryLanguage, options);
        appliedProcessors.push(`european-processing-${primaryLanguage}`);
      } else {
        // Default English processing with all enhancements
        processedText = this.processEnglishText(processedText, options);
        appliedProcessors.push('english-processing');
      }

      // Apply universal text preservation (always safe)
      processedText = this.applyUniversalPreservation(processedText);
      appliedProcessors.push('universal-preservation');

      const processingTime = performance.now() - startTime;

      return {
        processedText,
        processingTime,
        language: primaryLanguage,
        appliedProcessors
      };

    } catch (error) {
      const processingError = ErrorFactory.createError(
        ErrorCategory.OCR,
        'Text processing failed',
        { languages, optionsProvided: Object.keys(options), error }
      );
      
      // Safe fallback: return original text with minimal cleanup
      const fallbackText = this.applyBasicCleanup(text);
      const processingTime = performance.now() - startTime;

      return {
        processedText: fallbackText,
        processingTime,
        language: languages[0] || 'eng',
        appliedProcessors: ['fallback-basic-cleanup']
      };
    }
  }

  /**
   * Select primary language for processing based on capability priority
   */
  private static selectPrimaryLanguage(detectedLanguages: OCRLanguage[]): OCRLanguage {
    // Capability-based priority: Most capable OCR models first
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

  /**
   * Check if language is CJK (Chinese, Japanese, Korean)
   */
  private static isCJKLanguage(language: OCRLanguage): boolean {
    return ['chi_sim', 'chi_tra', 'jpn', 'kor'].includes(language);
  }

  /**
   * Check if language is European (Latin-based)
   */
  private static isEuropeanLanguage(language: OCRLanguage): boolean {
    return ['fra', 'deu', 'spa', 'rus'].includes(language);
  }

  /**
   * Process CJK languages (Chinese, Japanese, Korean)
   */
  private static processCJKText(text: string, language: OCRLanguage): string {
    switch (language) {
      case 'chi_sim':
      case 'chi_tra':
        return this.processChineseText(text);
      case 'jpn':
        return this.processJapaneseText(text);
      case 'kor':
        return this.processKoreanText(text);
      default:
        return this.applyUniversalPreservation(text);
    }
  }

  /**
   * Process European languages
   */
  private static processEuropeanText(
    text: string, 
    language: OCRLanguage, 
    options: TextProcessingOptions
  ): string {
    switch (language) {
      case 'fra':
        return this.processFrenchText(text, options);
      case 'deu':
        return this.processGermanText(text, options);
      case 'spa':
        return this.processSpanishText(text, options);
      case 'rus':
        return this.processRussianText(text, options);
      default:
        return this.processEnglishText(text, options);
    }
  }

  /**
   * Process English text with full enhancement suite
   */
  private static processEnglishText(text: string, options: TextProcessingOptions): string {
    // Step 1: Basic cleanup
    let processed = this.applyBasicCleanup(text);
    
    // Step 2: Fix common OCR character errors
    processed = this.fixCharacterErrors(processed);
    
    // Step 3: Fix number formatting issues
    processed = this.fixNumberFormatting(processed);
    
    // Step 4: Fix legal/business terminology
    if (options.applyLegalTermFixes !== false) {
      processed = this.fixLegalTerminology(processed);
    }
    
    // Step 5: Fix spacing and punctuation
    if (options.enhancedPunctuation !== false) {
      processed = this.fixSpacingAndPunctuation(processed);
    }
    
    // Step 6: Reconstruct paragraphs intelligently
    if (options.preserveParagraphs !== false) {
      processed = this.applyIntelligentParagraphReconstruction(processed);
    }
    
    // Step 7: Final cleanup
    processed = this.applyFinalCleanup(processed);
    
    return processed;
  }

  /**
   * Process Chinese text
   */
  private static processChineseText(text: string): string {
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

  /**
   * Process Japanese text
   */
  private static processJapaneseText(text: string): string {
    return text
      // Fix Japanese punctuation spacing
      .replace(/。\s*(?=[^\s])/g, '。')   // No space after period in Japanese
      .replace(/、\s*(?=[^\s])/g, '、')   // No space after comma in Japanese
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  /**
   * Process Korean text
   */
  private static processKoreanText(text: string): string {
    return text
      // Fix Korean punctuation and spacing
      .replace(/\.\s*(?=[^\s])/g, '. ')  // Add space after period
      .replace(/,\s*(?=[^\s])/g, ', ')   // Add space after comma
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  /**
   * Process French text
   */
  private static processFrenchText(text: string, options: TextProcessingOptions): string {
    // Apply universal paragraph preservation for European languages
    let processed = this.applyUniversalParagraphPreservation(text);

    // French-specific punctuation rules
    processed = processed
      .replace(/\s+([!?:;])/g, ' $1')  // Space before exclamation, question, colon, semicolon
      .replace(/«\s*/g, '« ')          // French quotes
      .replace(/\s*»/g, ' »');

    // Final cleanup while preserving paragraph structure
    return this.applyFinalCleanupUniversal(processed);
  }

  /**
   * Process German text
   */
  private static processGermanText(text: string, options: TextProcessingOptions): string {
    // Apply universal paragraph preservation
    let processed = this.applyUniversalParagraphPreservation(text);

    // German-specific fixes
    processed = processed
      .replace(/ß/g, 'ß')              // Ensure proper ß character
      .replace(/ae/g, 'ä')             // Common OCR error
      .replace(/oe/g, 'ö')             // Common OCR error
      .replace(/ue/g, 'ü');            // Common OCR error

    return this.applyFinalCleanupUniversal(processed);
  }

  /**
   * Process Spanish text
   */
  private static processSpanishText(text: string, options: TextProcessingOptions): string {
    // Apply universal paragraph preservation
    let processed = this.applyUniversalParagraphPreservation(text);

    // Spanish-specific fixes
    processed = processed
      .replace(/n~/g, 'ñ')             // Fix ñ character
      .replace(/¿\s*/g, '¿')           // Spanish question marks
      .replace(/\s*\?/g, '?')
      .replace(/¡\s*/g, '¡')           // Spanish exclamation marks
      .replace(/\s*!/g, '!');

    return this.applyFinalCleanupUniversal(processed);
  }

  /**
   * Process Russian text
   */
  private static processRussianText(text: string, options: TextProcessingOptions): string {
    return text
      // Fix Cyrillic character recognition errors
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      // Russian-specific fixes would go here
      .trim();
  }

  /**
   * Apply basic cleanup
   */
  private static applyBasicCleanup(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
  }

  /**
   * Fix common OCR character errors
   */
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

  /**
   * Fix number formatting issues
   */
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

  /**
   * Fix legal terminology
   */
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

  /**
   * Fix spacing and punctuation
   */
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

  /**
   * Apply intelligent paragraph reconstruction
   */
  private static applyIntelligentParagraphReconstruction(text: string): string {
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

  /**
   * Check if line is definitely a new paragraph
   */
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

  /**
   * Check if lines should definitely be joined
   */
  private static shouldDefinitelyJoin(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // Don't join if current line looks like a new paragraph
    if (this.isDefiniteNewParagraph(line)) return false;

    const trimmedParagraph = currentParagraph.trim();

    // Join on hyphen, "and", "or"
    const highConfidenceJoinIndicators = [
      /-$/,
      /\sand$/,
      /\sor$/,
    ];

    if (highConfidenceJoinIndicators.some(pattern => pattern.test(trimmedParagraph))) {
      return true;
    }

    // Join on comma, but only if the next line doesn't start with a capital letter
    if (trimmedParagraph.endsWith(',') && !/^[A-Z]/.test(line)) {
      return true;
    }

    // Join if current line starts with lowercase (likely continuation)
    if (/^[a-z]/.test(line)) return true;

    return false;
  }

  /**
   * Apply universal paragraph preservation (language-agnostic)
   */
  private static applyUniversalParagraphPreservation(text: string): string {
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

  /**
   * Universal paragraph starter detection (language-agnostic)
   */
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

  /**
   * Check if lines should be universally joined
   */
  private static shouldUniversallyJoin(currentParagraph: string, line: string): boolean {
    if (!currentParagraph || !line) return false;

    // Don't join if current line looks like a new paragraph
    if (this.isUniversalNewParagraph(line)) return false;

    // Universal join indicators (very conservative)
    const universalJoinIndicators = [
      /-$/,                               // Previous line ends with hyphen
      /,$/,                               // Previous line ends with comma
    ];

    // Check if previous line has universal join indicator
    if (universalJoinIndicators.some(pattern => pattern.test(currentParagraph.trim()))) {
      return true;
    }

    // Join if current line starts with lowercase (likely continuation)
    if (/^[a-z]/.test(line)) return true;

    return false;
  }

  /**
   * Apply universal preservation (always safe)
   */
  private static applyUniversalPreservation(text: string): string {
    return this.applyUniversalParagraphPreservation(text);
  }

  /**
   * Apply final cleanup
   */
  private static applyFinalCleanup(text: string): string {
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

  /**
   * Apply final cleanup (universal version)
   */
  private static applyFinalCleanupUniversal(text: string): string {
    return text
      .replace(/\s{2,}/g, ' ')           // Multiple spaces to single
      .replace(/\n{3,}/g, '\n\n')       // Multiple newlines to double
      .trim();
  }

  /**
   * Get supported languages for processing
   */
  public static getSupportedLanguages(): OCRLanguage[] {
    return SUPPORTED_LANGUAGES.map(lang => lang.code);
  }

  /**
   * Get processing capabilities for a language
   */
  public static getLanguageCapabilities(language: OCRLanguage): {
    characterCorrection: boolean;
    legalTerminology: boolean;
    paragraphReconstruction: boolean;
    enhancedPunctuation: boolean;
  } {
    const isCJK = this.isCJKLanguage(language);
    const isEuropean = this.isEuropeanLanguage(language);
    const isEnglish = language === 'eng';

    return {
      characterCorrection: isEnglish || isEuropean,
      legalTerminology: isEnglish,
      paragraphReconstruction: isEnglish || isEuropean,
      enhancedPunctuation: !isCJK
    };
  }
}

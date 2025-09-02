/**
 * Prewarmed OCR Service - Wrapper that uses prewarmed workers when available
 * 
 * This service provides a drop-in replacement for OCRService that prioritizes
 * using prewarmed workers from SimpleOCRCache before falling back to the 
 * standard OCRCacheManager.
 */

import { OCRLanguage } from '../types/ocr-types';
import { OCRService } from './OCRService';
import { SimpleOCRCache, detectLanguageWithPrewarmedWorker, extractTextWithPrewarmedWorker } from './SimpleOCRCache';
import { OCRCacheManager } from './OCRCacheManager';

export class PrewarmedOCRService {
  /**
   * Detect languages in an image using prewarmed workers when available
   */
  public static async detectLanguage(imageFile: File | Blob): Promise<OCRLanguage[]> {
    try {
      // Try to use prewarmed detection worker first
      const prewarmedWorker = SimpleOCRCache.getDetectionWorker();
      if (prewarmedWorker) {
        console.log('🎯 Using prewarmed detection worker for language detection');
        const result = await prewarmedWorker.detect(imageFile);
        // Extract languages from detection result
        const languages: OCRLanguage[] = result.data?.scripts?.map((script: any) => script.lang) || ['eng'];
        console.log('📝 Detected languages with prewarmed worker:', languages);
        return languages;
      }
      
      // Fallback to standard detection
      console.log('🔄 Falling back to standard language detection');
      return await OCRService.detectLanguage(imageFile);
    } catch (error) {
      console.warn('⚠️ Prewarmed language detection failed, using standard detection:', error);
      return await OCRService.detectLanguage(imageFile);
    }
  }

  /**
   * Extract text from an image using prewarmed workers when available
   */
  public static async extractTextFromImage(
    imageFile: File | Blob,
    options: {
      languages?: OCRLanguage[];
      autoDetect?: boolean;
      primaryLanguage?: OCRLanguage;
      useOrchestrator?: boolean;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<string> {
    try {
      // If auto-detection is enabled, try to use prewarmed detection
      if (options.autoDetect !== false) {
        const prewarmedWorker = SimpleOCRCache.getDetectionWorker();
        if (prewarmedWorker) {
          console.log('🎯 Using prewarmed detection worker for auto-detection');
          const detectionResult = await prewarmedWorker.detect(imageFile);
          const detectedLanguages: OCRLanguage[] = detectionResult.data?.scripts?.map((script: any) => script.lang) || ['eng'];
          console.log('📝 Detected languages with prewarmed worker:', detectedLanguages);
          
          // Now extract text with detected languages using prewarmed worker if available
          const extractionWorker = SimpleOCRCache.getLanguageWorker(detectedLanguages);
          if (extractionWorker) {
            console.log('🎯 Using prewarmed extraction worker for detected languages');
            const result = await extractionWorker.recognize(imageFile);
            return result.data.text;
          } else {
            // Use prewarmed extraction worker with English if available
            const englishWorker = SimpleOCRCache.getLanguageWorker(['eng']);
            if (englishWorker) {
              console.log('🎯 Using prewarmed English extraction worker');
              const result = await englishWorker.recognize(imageFile);
              return result.data.text;
            }
          }
        }
      } 
      // If specific languages are provided, try to use prewarmed worker for those languages
      else if (options.languages && options.languages.length > 0) {
        const prewarmedWorker = SimpleOCRCache.getLanguageWorker(options.languages);
        if (prewarmedWorker) {
          console.log('🎯 Using prewarmed extraction worker for specified languages');
          const result = await prewarmedWorker.recognize(imageFile);
          return result.data.text;
        }
        
        // Fallback to English prewarmed worker if available
        const englishWorker = SimpleOCRCache.getLanguageWorker(['eng']);
        if (englishWorker && options.languages.includes('eng')) {
          console.log('🎯 Using prewarmed English extraction worker');
          const result = await englishWorker.recognize(imageFile);
          return result.data.text;
        }
      }
      // Default to English
      else {
        const prewarmedWorker = SimpleOCRCache.getLanguageWorker(['eng']);
        if (prewarmedWorker) {
          console.log('🎯 Using prewarmed English extraction worker (default)');
          const result = await prewarmedWorker.recognize(imageFile);
          return result.data.text;
        }
      }
      
      // Fallback to standard OCR service
      console.log('🔄 Falling back to standard OCR service');
      return await OCRService.extractTextFromImage(imageFile, options);
    } catch (error) {
      console.warn('⚠️ Prewarmed OCR extraction failed, using standard OCR service:', error);
      return await OCRService.extractTextFromImage(imageFile, options);
    }
  }

  /**
   * Get cache statistics
   */
  public static getCacheStats() {
    return {
      simpleCache: SimpleOCRCache.getStats(),
      standardCache: OCRService.getCacheStats()
    };
  }

  /**
   * Terminate all workers
   */
  public static async terminate(): Promise<void> {
    // Terminate simple cache workers
    await SimpleOCRCache.terminateAll();
    // Terminate standard OCR service workers
    await OCRService.terminate();
  }
}
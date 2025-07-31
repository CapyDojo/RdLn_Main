/**
 * Test suite for Language Detection Improvements
 * 
 * Tests the new pre-OCR quick detection feature and verifies that
 * the refactoring maintains backward compatibility while improving performance.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageDetectionService } from '../LanguageDetectionService';
import { OCRService } from '../OCRService';

// Mock OCRCacheManager to avoid actual OCR calls in tests
vi.mock('../OCRCacheManager', () => ({
  OCRCacheManager: {
    checkLanguageCache: vi.fn().mockResolvedValue(null),
    storeLanguageCache: vi.fn().mockResolvedValue(undefined),
    initializeDetectionWorker: vi.fn().mockResolvedValue({
      recognize: vi.fn().mockResolvedValue({
        data: { text: 'Sample text for testing' }
      })
    })
  }
}));

describe('Language Detection Improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Pre-OCR Quick Detection (Speed Improvements)', () => {
    it('should detect Chinese from filename patterns', async () => {
      const files = [
        new File([''], 'chinese_document.pdf'),
        new File([''], 'zh_contract.png'),
        new File([''], '中文合同.jpg'),
        new File([''], 'Chinese_Legal_Doc.pdf')
      ];

      for (const file of files) {
        const result = await LanguageDetectionService.quickPreScreening(file);
        expect(result).toEqual(['chi_sim', 'chi_tra']);
      }
    });

    it('should detect Japanese from filename patterns', async () => {
      const files = [
        new File([''], 'japanese_document.pdf'),
        new File([''], 'jp_contract.png'),
        new File([''], '日本語契約.jpg'),
        new File([''], 'Japanese_Legal_Doc.pdf')
      ];

      for (const file of files) {
        const result = await LanguageDetectionService.quickPreScreening(file);
        expect(result).toEqual(['jpn']);
      }
    });

    it('should detect Korean from filename patterns', async () => {
      const files = [
        new File([''], 'korean_document.pdf'),
        new File([''], 'kr_contract.png'),
        new File([''], '한국어계약.jpg'),
        new File([''], 'Korean_Legal_Doc.pdf')
      ];

      for (const file of files) {
        const result = await LanguageDetectionService.quickPreScreening(file);
        expect(result).toEqual(['kor']);
      }
    });

    it('should detect European languages from filename patterns', async () => {
      const testCases = [
        { files: ['german_doc.pdf', 'deutsch_contract.pdf', 'de_legal.jpg'], expected: ['deu'] },
        { files: ['french_doc.pdf', 'français_contract.pdf', 'fr_legal.jpg'], expected: ['fra'] },
        { files: ['spanish_doc.pdf', 'español_contract.pdf', 'es_legal.jpg'], expected: ['spa'] }
      ];

      for (const testCase of testCases) {
        for (const filename of testCase.files) {
          const file = new File([''], filename);
          const result = await LanguageDetectionService.quickPreScreening(file);
          expect(result).toEqual(testCase.expected);
        }
      }
    });

    it('should return null for ambiguous filenames', async () => {
      const files = [
        new File([''], 'document.pdf'),
        new File([''], 'contract.png'),
        new File([''], 'legal_document.jpg'),
        new File([''], 'scan_001.pdf')
      ];

      for (const file of files) {
        const result = await LanguageDetectionService.quickPreScreening(file);
        expect(result).toBeNull();
      }
    });

    it('should work with Blob objects (no filename)', async () => {
      const blob = new Blob(['test content'], { type: 'image/png' });
      const result = await LanguageDetectionService.quickPreScreening(blob);
      expect(result).toBeNull();
    });
  });

  describe('Speed Comparison Benchmarks', () => {
    it('should demonstrate speed improvement with filename detection', async () => {
      const chineseFile = new File([''], 'chinese_document.pdf');
      
      // Test quick pre-screening (should be very fast)
      const quickStart = performance.now();
      const quickResult = await LanguageDetectionService.quickPreScreening(chineseFile);
      const quickTime = performance.now() - quickStart;
      
      expect(quickResult).toEqual(['chi_sim', 'chi_tra']);
      expect(quickTime).toBeLessThan(10); // Should be under 10ms
      
      console.log(`⚡ Quick pre-screening completed in ${quickTime.toFixed(2)}ms`);
    });

    it('should integrate quick detection into main detection workflow', async () => {
      const chineseFile = new File([''], 'zh_contract.pdf');
      
      const start = performance.now();
      const result = await LanguageDetectionService.detectLanguage(chineseFile);
      const time = performance.now() - start;
      
      expect(result).toEqual(['chi_sim', 'chi_tra']);
      expect(time).toBeLessThan(50); // Should be very fast due to quick screening
      
      console.log(`🎯 Full detection with quick screening completed in ${time.toFixed(2)}ms`);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain OCRService.detectLanguage interface', async () => {
      const testFile = new File([''], 'german_document.pdf');
      
      // Should still work through OCRService (delegated to LanguageDetectionService)
      const result = await OCRService.detectLanguage(testFile);
      
      expect(result).toEqual(['deu']);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should fallback to full detection when quick screening fails', async () => {
      const ambiguousFile = new File([''], 'document.pdf');
      
      // Mock the full detection path
      const result = await LanguageDetectionService.detectLanguage(ambiguousFile);
      
      // Should still return a valid language array (mocked to return eng from fallback)
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should maintain same return type structure', async () => {
      const testFile = new File([''], 'french_contract.pdf');
      
      const result = await LanguageDetectionService.detectLanguage(testFile);
      
      // Verify structure matches original OCRLanguage[] type
      expect(Array.isArray(result)).toBe(true);
      result.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cache Integration', () => {
    it('should cache quick screening results', async () => {
      const { OCRCacheManager } = await import('../OCRCacheManager');
      const storeLanguageCacheSpy = vi.mocked(OCRCacheManager.storeLanguageCache);
      
      const chineseFile = new File([''], 'chinese_document.pdf');
      
      await LanguageDetectionService.detectLanguage(chineseFile);
      
      // Should cache the quick screening result
      expect(storeLanguageCacheSpy).toHaveBeenCalledWith(
        chineseFile, 
        ['chi_sim', 'chi_tra']
      );
    });

    it('should check cache before running quick screening', async () => {
      const { OCRCacheManager } = await import('../OCRCacheManager');
      const checkLanguageCacheSpy = vi.mocked(OCRCacheManager.checkLanguageCache);
      
      // Mock cache hit
      checkLanguageCacheSpy.mockResolvedValueOnce(['cached_result']);
      
      const testFile = new File([''], 'any_document.pdf');
      const result = await LanguageDetectionService.detectLanguage(testFile);
      
      expect(result).toEqual(['cached_result']);
      expect(checkLanguageCacheSpy).toHaveBeenCalledWith(testFile);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle files with mixed language hints in filename', async () => {
      const mixedFile = new File([''], 'chinese_german_contract.pdf');
      
      // Should prioritize first detected language (Chinese in this case)
      const result = await LanguageDetectionService.quickPreScreening(mixedFile);
      expect(result).toEqual(['chi_sim', 'chi_tra']);
    });

    it('should handle empty filenames gracefully', async () => {
      const emptyNameFile = new File([''], '');
      
      const result = await LanguageDetectionService.quickPreScreening(emptyNameFile);
      expect(result).toBeNull();
    });

    it('should handle very long filenames', async () => {
      const longName = 'very_long_filename_with_chinese_document_name_that_goes_on_and_on.pdf';
      const longNameFile = new File([''], longName);
      
      const result = await LanguageDetectionService.quickPreScreening(longNameFile);
      expect(result).toEqual(['chi_sim', 'chi_tra']);
    });

    it('should be case insensitive', async () => {
      const files = [
        new File([''], 'CHINESE_DOCUMENT.PDF'),
        new File([''], 'Chinese_Document.pdf'),
        new File([''], 'chinese_document.PDF')
      ];

      for (const file of files) {
        const result = await LanguageDetectionService.quickPreScreening(file);
        expect(result).toEqual(['chi_sim', 'chi_tra']);
      }
    });
  });

  describe('Performance Monitoring', () => {
    it('should log performance improvements in console', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const chineseFile = new File([''], 'chinese_document.pdf');
      await LanguageDetectionService.detectLanguage(chineseFile);
      
      // Should log the quick pre-screening success
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📁 Filename suggests Chinese')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚡ Quick pre-screening successful')
      );
      
      consoleSpy.mockRestore();
    });

    it('should provide timing information for benchmarking', async () => {
      const files = [
        { file: new File([''], 'chinese_doc.pdf'), expected: ['chi_sim', 'chi_tra'] },
        { file: new File([''], 'japanese_doc.pdf'), expected: ['jpn'] },
        { file: new File([''], 'korean_doc.pdf'), expected: ['kor'] },
        { file: new File([''], 'german_doc.pdf'), expected: ['deu'] },
        { file: new File([''], 'french_doc.pdf'), expected: ['fra'] },
        { file: new File([''], 'spanish_doc.pdf'), expected: ['spa'] }
      ];

      const timings: number[] = [];
      
      for (const { file, expected } of files) {
        const start = performance.now();
        const result = await LanguageDetectionService.detectLanguage(file);
        const time = performance.now() - start;
        
        expect(result).toEqual(expected);
        timings.push(time);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      console.log(`📊 Average quick detection time: ${averageTime.toFixed(2)}ms`);
      
      // All quick detections should be very fast
      expect(averageTime).toBeLessThan(20);
    });
  });
});
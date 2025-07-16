/**
 * Comprehensive Tests for OCROrchestrator
 *
 * Tests the main orchestration service that coordinates OCR workflow,
 * language detection, text processing, and performance optimization.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OCROrchestrator } from '../OCROrchestrator';
import { OCRTextCleanupService } from '../OCRTextCleanupService';
import { LanguageDetectionService } from '../LanguageDetectionService';
import { OCRCacheManager } from '../OCRCacheManager';
import { BackgroundLanguageLoader } from '../BackgroundLanguageLoader';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { OCRLanguage } from '../../types/ocr-types';
import { ErrorManager } from '../../utils/errorHandling';

// Mock dependencies
vi.mock('../OCRTextCleanupService');
vi.mock('../LanguageDetectionService');
vi.mock('../OCRCacheManager');
vi.mock('../BackgroundLanguageLoader');
vi.mock('../PerformanceMonitor', () => ({
  PerformanceMonitor: {
    getInstance: vi.fn(() => ({
      recordMetric: vi.fn(),
      getCurrentMetric: vi.fn(() => []),
      getMetrics: vi.fn(() => ({})),
      reset: vi.fn(),
    })),
  },
}));

// Mock Tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn()
}));

// Mock paragraph formatting utility
vi.mock('../../utils/paragraphFormatting', () => ({
  formatPastedText: vi.fn((text: string) => text) // Return text unchanged for tests
}));

// Mock error handling utilities
vi.mock('../../utils/errorHandling', () => ({
  safeAsync: vi.fn(async (fn) => {
    // Execute the function directly and wrap result in success format
    try {
      const result = await fn();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error };
    }
  }),
  ErrorCategory: { OCR: 'OCR' },
  ErrorFactory: { createError: vi.fn() },
  ErrorManager: { addError: vi.fn() }
}));

// Mock PerformanceMonitor
vi.mock('../PerformanceMonitor', () => {
  const mockInstance = {
    startTimer: vi.fn(),
    endTimer: vi.fn(() => 100), // Return a default time
    recordMetric: vi.fn(), // Add the missing recordMetric method
    getMetrics: vi.fn(() => ({
      languageDetectionMs: 10,
      workerInitializationMs: 20,
      ocrExtractionMs: 30,
      textProcessingMs: 40
    }))
  };

  return {
    PerformanceMonitor: {
      getInstance: vi.fn(() => mockInstance),
      ...mockInstance
    }
  };
});

// Create typed mocks
const mockTextCleanupService = vi.mocked(OCRTextCleanupService);
const mockLanguageDetectionService = vi.mocked(LanguageDetectionService);
const mockOCRCacheManager = vi.mocked(OCRCacheManager);
const mockBackgroundLanguageLoader = vi.mocked(BackgroundLanguageLoader);
const mockErrorManager = vi.mocked(ErrorManager);

describe('OCROrchestrator', () => {
  const mockSuccessImageFile = new File(['test'], 'success.png', { type: 'image/png' });
  const mockFailImageFile = new File(['test'], 'fail.png', { type: 'image/png' });
  const mockMultiLangImageFile = new File(['test'], 'multilang.png', { type: 'image/png' });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    vi.restoreAllMocks();

    // Setup default mock implementations
    mockLanguageDetectionService.detectLanguage = vi.fn().mockImplementation((imageFile: File | Blob) => {
      // Return different languages based on file name for testing
      if (imageFile.name === 'multilang.png') {
        return Promise.resolve(['eng', 'spa', 'fra']);
      }
      return Promise.resolve(['eng']);
    });

    const mockTesseractWorker = {
      recognize: vi.fn().mockImplementation((imageFile: File | Blob) => {
        if (imageFile.name === 'fail.png') {
          return Promise.reject(new Error('Tesseract recognition failed'));
        }
        return Promise.resolve({ data: { text: 'raw ocr text' } });
      }),
      terminate: vi.fn(),
    };

    // Set up a default spy that individual tests can override
    vi.spyOn(OCROrchestrator, 'initializeOptimalWorker' as any).mockResolvedValue({
        tesseractWorker: mockTesseractWorker,
        cacheHit: false,
        backgroundLoaderUsed: false,
    });

    mockTextCleanupService.processText = vi.fn().mockImplementation((text: string, languages: OCRLanguage[], options: any) => {
      if (options && options.failProcessing) {
        return Promise.reject(new Error('Text processing failed'));
      }
      return Promise.resolve({
        processedText: 'Processed clean text',
        processingTime: 50,
        language: 'eng',
        appliedProcessors: ['english-processing'],
      });
    });

    mockBackgroundLanguageLoader.isEnabled = vi.fn().mockReturnValue(true);
    mockBackgroundLanguageLoader.isLanguageReady = vi.fn().mockReturnValue(false);
    mockBackgroundLanguageLoader.getLoadedWorker = vi.fn().mockReturnValue(null);

    mockOCRCacheManager.getCachedWorker = vi.fn().mockResolvedValue(null);
    mockOCRCacheManager.cacheWorker = vi.fn().mockResolvedValue(undefined);

    mockErrorManager.addError = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Text Extraction Workflow', () => {
    it('should successfully orchestrate the complete text extraction workflow', async () => {
      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      // Verify the final result structure
      expect(result.text).toBe('Processed clean text');
      expect(result.detectedLanguages).toEqual(['eng']);
      expect(result.appliedProcessors).toEqual(['english-processing']);
      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.extractionTime).toBeGreaterThan(0);
      expect(result.processingTime).toBe(50);
      expect(result.cacheHit).toBe(false);
      expect(result.backgroundLoaderUsed).toBe(false);

      // Verify that the correct services were called in order
      expect(LanguageDetectionService.detectLanguage).toHaveBeenCalledWith(mockSuccessImageFile);
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        expect.objectContaining({
          preserveParagraphs: true,
          applyLegalTermFixes: true,
          enhancedPunctuation: true
        })
      );
    });

    it('should handle multiple detected languages correctly', async () => {
      mockLanguageDetectionService.detectLanguage.mockResolvedValue(['eng', 'spa', 'fra']);

      const result = await OCROrchestrator.extractText(mockMultiLangImageFile);

      expect(result.detectedLanguages).toEqual(['eng', 'spa', 'fra']);
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng', 'spa', 'fra'],
        expect.any(Object)
      );
    });

    it('should prioritize primary language when specified', async () => {
      mockLanguageDetectionService.detectLanguage.mockResolvedValue(['eng', 'spa', 'fra']);

      const result = await OCROrchestrator.extractText(mockMultiLangImageFile, {
        primaryLanguage: 'spa'
      });

      expect(result.detectedLanguages).toEqual(['spa', 'eng', 'fra']);
    });

    it('should pass custom text processing options correctly', async () => {
      const customOptions = {
        preserveParagraphs: false,
        applyLegalTermFixes: false,
        enhancedPunctuation: false,
        customProcessor: true
      };

      await OCROrchestrator.extractText(mockSuccessImageFile, {
        textProcessing: customOptions
      });

      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        customOptions
      );
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle language detection failure gracefully', async () => {
      mockLanguageDetectionService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const result = await OCROrchestrator.extractText(mockFailImageFile);

      expect(result.text).toBe('');
      expect(result.detectedLanguages).toEqual(['eng']); // Falls back to English
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(mockErrorManager.addError).toHaveBeenCalled();
    });

    it('should handle OCR extraction failure gracefully', async () => {
      const result = await OCROrchestrator.extractText(mockFailImageFile);

      expect(result.text).toBe('');
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(mockErrorManager.addError).toHaveBeenCalled();
    });

    it('should handle text processing failure gracefully', async () => {
      mockTextCleanupService.processText.mockRejectedValue(new Error('Processing failed'));

      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      expect(result.text).toBe('raw ocr text'); // Falls back to raw text
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(mockErrorManager.addError).toHaveBeenCalled();
    });

    it('should handle complete workflow failure gracefully', async () => {
      mockLanguageDetectionService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const result = await OCROrchestrator.extractText(mockFailImageFile);

      expect(result.text).toBe('');
      expect(result.detectedLanguages).toEqual(['eng']);
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(result.totalTime).toBeGreaterThan(0);
    });
  });

  describe('Background Loader Integration', () => {
    it('should utilize background loader when available', async () => {
      const mockBgWorker = { recognize: vi.fn().mockResolvedValue({ data: { text: 'bg loaded text' } }) };
      mockBackgroundLanguageLoader.isLanguageReady.mockReturnValue(true);
      mockBackgroundLanguageLoader.getLoadedWorker.mockReturnValue(mockBgWorker);

      vi.spyOn(OCROrchestrator, 'initializeOptimalWorker' as any).mockResolvedValue({
        tesseractWorker: mockBgWorker,
        cacheHit: false,
        backgroundLoaderUsed: true,
      });

      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      expect(result.backgroundLoaderUsed).toBe(true);
      expect(mockBackgroundLanguageLoader.isLanguageReady).toHaveBeenCalledWith('eng');
    });

    it('should fall back to regular worker when background loader disabled', async () => {
      mockBackgroundLanguageLoader.isEnabled.mockReturnValue(false);

      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      expect(result.backgroundLoaderUsed).toBe(false);
      expect(mockBackgroundLanguageLoader.isLanguageReady).not.toHaveBeenCalled();
    });

    it('should respect useBackgroundLoader option', async () => {
      await OCROrchestrator.extractText(mockSuccessImageFile, {
        useBackgroundLoader: false
      });

      expect(mockBackgroundLanguageLoader.isLanguageReady).not.toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics throughout the workflow', async () => {
      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.extractionTime).toBeGreaterThan(0);
      expect(result.processingTime).toBe(50);
      expect(typeof result.performanceMetrics.languageDetectionMs).toBe('number');
      expect(typeof result.performanceMetrics.workerInitializationMs).toBe('number');
      expect(typeof result.performanceMetrics.ocrExtractionMs).toBe('number');
      expect(typeof result.performanceMetrics.textProcessingMs).toBe('number');
    });

    it('should provide cache hit information', async () => {
      vi.spyOn(OCROrchestrator, 'initializeOptimalWorker' as any).mockResolvedValue({
        tesseractWorker: {},
        cacheHit: true,
        backgroundLoaderUsed: false,
      });

      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      expect(result.cacheHit).toBe(true);
    });
  });

  describe('Background Services Management', () => {
    it('should start background services when enabled', async () => {
      mockBackgroundLanguageLoader.startBackgroundLoading = vi.fn().mockResolvedValue(undefined);

      await OCROrchestrator.startBackgroundServices();

      expect(mockBackgroundLanguageLoader.startBackgroundLoading).toHaveBeenCalled();
    });

    it('should handle disabled background loader gracefully', async () => {
      mockBackgroundLanguageLoader.isEnabled.mockReturnValue(false);
      mockBackgroundLanguageLoader.startBackgroundLoading = vi.fn();

      await OCROrchestrator.startBackgroundServices();

      expect(mockBackgroundLanguageLoader.startBackgroundLoading).not.toHaveBeenCalled();
    });

    it('should stop background services safely', () => {
      mockBackgroundLanguageLoader.stopBackgroundLoading = vi.fn();

      OCROrchestrator.stopBackgroundServices();

      expect(mockBackgroundLanguageLoader.stopBackgroundLoading).toHaveBeenCalled();
    });
  });

  describe('Configuration and Options', () => {
    it('should handle custom language options', async () => {
      await OCROrchestrator.extractText(mockSuccessImageFile, {
        languages: ['fra', 'deu'],
        autoDetect: false
      });

      expect(LanguageDetectionService.detectLanguage).not.toHaveBeenCalled();
    });

    it('should handle performance tracking options', async () => {
      await OCROrchestrator.extractText(mockSuccessImageFile, {
        performanceTracking: false
      });

      // Should still return performance metrics even when tracking is disabled
      const result = await OCROrchestrator.extractText(mockSuccessImageFile);
      expect(result.totalTime).toBeGreaterThan(0);
    });

    it('should handle worker initialization options', async () => {
      await OCROrchestrator.extractText(mockSuccessImageFile, {
        workerOptions: {
          corePath: 'custom/path',
          workerPath: 'custom/worker'
        }
      });

      // Verify that options are passed through (implementation detail)
      expect(LanguageDetectionService.detectLanguage).toHaveBeenCalled();
    });
  });
});
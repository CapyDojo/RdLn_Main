/**
 * Tests for OCROrchestrator
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OCROrchestrator } from '../OCROrchestrator';
import { OCRTextCleanupService } from '../OCRTextCleanupService';
import { LanguageDetectionService } from '../LanguageDetectionService';
import { OCRCacheManager } from '../OCRCacheManager';
import { BackgroundLanguageLoader } from '../BackgroundLanguageLoader';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { OCRLanguage } from '../../src/types/ocr-types';
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
    })),
  },
}));
vi.mock('../../utils/errorHandling');

// Create typed mocks
const mockTextCleanupService = vi.mocked(OCRTextCleanupService);
const mockLanguageDetectionService = vi.mocked(LanguageDetectionService);
const mockOCRCacheManager = vi.mocked(OCRCacheManager);
const mockBackgroundLanguageLoader = vi.mocked(BackgroundLanguageLoader);
const mockErrorManager = vi.mocked(ErrorManager);

describe('OCROrchestrator', () => {
  const mockSuccessImageFile = new File(['test'], 'success.png', { type: 'image/png' });
  const mockFailImageFile = new File(['test'], 'fail.png', { type: 'image/png' });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup default mock implementations
    mockLanguageDetectionService.detectLanguage = vi.fn().mockResolvedValue(['eng']);

    const mockTesseractWorker = {
      recognize: vi.fn().mockImplementation((imageFile: File | Blob) => {
        if (imageFile.name === 'fail.png') {
          return Promise.reject(new Error('Tesseract recognition failed'));
        }
        return Promise.resolve({ data: { text: 'raw ocr text' } });
      }),
      terminate: vi.fn(),
    };
    
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

    mockErrorManager.addError = vi.fn();
  });

  describe('extractText', () => {
    it('should successfully orchestrate the text extraction workflow', async () => {
      const result = await OCROrchestrator.extractText(mockSuccessImageFile);

      // Verify the final result
      expect(result.text).toBe('Processed clean text');
      expect(result.detectedLanguages).toEqual(['eng']);
      expect(result.appliedProcessors).toEqual(['english-processing']);
      expect(result.totalTime).toBeGreaterThan(0);

      // Verify that the correct services were called
      expect(LanguageDetectionService.detectLanguage).toHaveBeenCalledWith(mockSuccessImageFile);
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        {}
      );
    });

    it('should handle language detection failure gracefully', async () => {
      // Arrange: Simulate language detection failure
      mockLanguageDetectionService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const result = await OCROrchestrator.extractText(mockFailImageFile);

      // Assert: Should fallback to English and still complete the process
      expect(result.text).toBe(''); // Expect empty string on error
      expect(result.detectedLanguages).toEqual(['eng']); // Falls back to 'eng'
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(OCRTextCleanupService.processText).not.toHaveBeenCalled(); // Should not call cleanup service
    });

    it('should pass text processing options to the cleanup service', async () => {
      const textProcessingOptions = { applyLegalTermFixes: true, failProcessing: true };

      const result = await OCROrchestrator.extractText(mockSuccessImageFile, { textProcessing: textProcessingOptions });

      expect(result.text).toBe('');
      expect(result.detectedLanguages).toEqual(['eng']);
      expect(result.appliedProcessors).toEqual(['error-fallback']);
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        textProcessingOptions
      );
    });
});
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
import { ErrorManager } from '../../utils/errorHandling';

// Mock dependencies
vi.mock('../OCRTextCleanupService');
vi.mock('../LanguageDetectionService');
vi.mock('../OCRCacheManager');
vi.mock('../BackgroundLanguageLoader');
vi.mock('../PerformanceMonitor');
vi.mock('../../utils/errorHandling');

// Create typed mocks
const mockTextCleanupService = vi.mocked(OCRTextCleanupService);
const mockLanguageDetectionService = vi.mocked(LanguageDetectionService);
const mockOCRCacheManager = vi.mocked(OCRCacheManager);
const mockBackgroundLanguageLoader = vi.mocked(BackgroundLanguageLoader);
const mockPerformanceMonitor = vi.mocked(PerformanceMonitor.prototype);
const mockErrorManager = vi.mocked(ErrorManager);

// Mock the static getInstance method for PerformanceMonitor
const mockGetInstance = vi.fn(() => mockPerformanceMonitor);
vi.spyOn(PerformanceMonitor, 'getInstance').mockImplementation(mockGetInstance);

describe('OCROrchestrator', () => {
  const mockImageFile = new File(['test'], 'test.png', { type: 'image/png' });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Inject the mock performance monitor
    OCROrchestrator.setPerformanceMonitor(mockPerformanceMonitor);

    // Setup default mock implementations
    mockLanguageDetectionService.detectLanguage = vi.fn().mockResolvedValue(['eng']);

    const mockTesseractWorker = {
      recognize: vi.fn().mockResolvedValue({ data: { text: 'raw ocr text' } }),
      terminate: vi.fn(),
    };
    
    vi.spyOn(OCROrchestrator, 'initializeOptimalWorker' as any).mockResolvedValue({
        tesseractWorker: mockTesseractWorker,
        cacheHit: false,
        backgroundLoaderUsed: false,
    });

    mockTextCleanupService.processText = vi.fn().mockResolvedValue({
      processedText: 'Processed clean text',
      processingTime: 50,
      language: 'eng',
      appliedProcessors: ['english-processing'],
    });

    mockErrorManager.addError = vi.fn();
    mockPerformanceMonitor.recordMetric = vi.fn();
    mockPerformanceMonitor.recordMetric = vi.fn();
    mockPerformanceMonitor.recordMetric = vi.fn();
    mockPerformanceMonitor.recordMetric = vi.fn();
    mockPerformanceMonitor.recordMetric = vi.fn();
  });

  describe('extractText', () => {
    it('should successfully orchestrate the text extraction workflow', async () => {
      const result = await OCROrchestrator.extractText(mockImageFile);

      if (!result) {
        throw new Error('extractText returned undefined');
      }

      // Verify the final result
      expect(result.text).toBe('Processed clean text');
      expect(result.detectedLanguages).toEqual(['eng']);
      expect(result.appliedProcessors).toEqual(['english-processing']);
      expect(result.totalTime).toBeGreaterThan(0);

      // Verify that the correct services were called
      expect(LanguageDetectionService.detectLanguage).toHaveBeenCalledWith(mockImageFile);
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        {}
      );
    });

    it('should handle language detection failure gracefully', async () => {
      // Arrange: Simulate language detection failure
      mockLanguageDetectionService.detectLanguage.mockRejectedValue(new Error('Detection failed'));

      const result = await OCROrchestrator.extractText(mockImageFile);

      if (!result) {
        throw new Error('extractText returned undefined');
      }

      // Assert: Should fallback to English and still complete the process
      expect(result.text).toBe('Processed clean text');
      expect(result.detectedLanguages).toEqual(['eng']); // Falls back to 'eng'
      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'], // Called with fallback language
        {}
      );
    });

    it('should pass text processing options to the cleanup service', async () => {
      const textProcessingOptions = { applyLegalTermFixes: true };

      const result = await OCROrchestrator.extractText(mockImageFile, { textProcessing: textProcessingOptions });

      if (!result) {
        throw new Error('extractText returned undefined');
      }

      expect(OCRTextCleanupService.processText).toHaveBeenCalledWith(
        'raw ocr text',
        ['eng'],
        textProcessingOptions
      );
    });
  });
});

/**
 * Test file to demonstrate and validate OCR error handling patterns
 */

import { describe, it, expect, vi } from 'vitest';
import { OCRErrorDetection, OCRErrorHandler, OCRErrorUtils } from '../../src/utils/ocrErrorHandling';

describe('OCR Error Handling', () => {
  describe('OCRErrorDetection', () => {
    it('should detect legacy model errors', () => {
      const legacyErrors = [
        new Error('worker.detect requires Legacy model'),
        new Error('detect requires Legacy model'),
        new Error('OSD requires legacy support'),
        'Legacy model required'
      ];

      legacyErrors.forEach(error => {
        expect(OCRErrorDetection.isLegacyError(error)).toBe(true);
      });
    });

    it('should detect worker validation errors', () => {
      const workerErrors = [
        new Error('Worker is invalid'),
        new Error('does not support detect method'),
        new Error('worker is null'),
        new Error('postMessage error'),
        'Cannot read properties of null'
      ];

      workerErrors.forEach(error => {
        expect(OCRErrorDetection.isWorkerValidationError(error)).toBe(true);
      });
    });

    it('should detect parameter setting errors', () => {
      const paramErrors = [
        new Error('setParameters failed'),
        new Error('invalid parameter'),
        new Error('tessedit_ocr_engine_mode not supported'),
        'Unable to set parameter'
      ];

      paramErrors.forEach(error => {
        expect(OCRErrorDetection.isParameterSettingError(error)).toBe(true);
      });
    });

    it('should detect worker lifecycle errors', () => {
      const lifecycleErrors = [
        new Error('Worker timeout'),
        new Error('initialization failed'),
        new Error('Failed to create worker'),
        'terminate failed'
      ];

      lifecycleErrors.forEach(error => {
        expect(OCRErrorDetection.isWorkerLifecycleError(error)).toBe(true);
      });
    });

    it('should detect resource loading errors', () => {
      const resourceErrors = [
        new Error('network error'),
        new Error('fetch failed'),
        new Error('loading language traineddata'),
        'tesseract-core not found'
      ];

      resourceErrors.forEach(error => {
        expect(OCRErrorDetection.isResourceLoadingError(error)).toBe(true);
      });
    });

    it('should categorize errors correctly', () => {
      const legacyError = new Error('worker.detect requires Legacy model');
      const category = OCRErrorDetection.categorizeError(legacyError);
      
      expect(category.category).toBe('legacy');
      expect(category.isRecoverable).toBe(true);
      expect(category.recommendedAction).toContain('legacy support');
    });
  });

  describe('OCRErrorHandler', () => {
    it('should validate workers correctly', () => {
      const validWorker = {
        recognize: vi.fn(),
        detect: vi.fn(),
        terminate: vi.fn()
      };

      const invalidWorker = {
        someMethod: vi.fn()
      };

      expect(OCRErrorHandler.validateWorker(validWorker, ['recognize', 'detect'])).toBe(true);
      expect(OCRErrorHandler.validateWorker(invalidWorker, ['recognize', 'detect'])).toBe(false);
      expect(OCRErrorHandler.validateWorker(null, ['recognize'])).toBe(false);
    });

    it('should create standardized error messages', () => {
      const error = new Error('test error');
      const message = OCRErrorHandler.createStandardizedErrorMessage(
        'test operation',
        error,
        { context: 'value' }
      );

      expect(message).toContain('OCR test operation failed');
      expect(message).toContain('test error');
      expect(message).toContain('context: value');
      expect(message).toContain('Category:');
      expect(message).toContain('Recoverable:');
    });

    it('should handle async operations with error wrapping', async () => {
      const successOperation = vi.fn().mockResolvedValue('success');
      const recoverableFailure = vi.fn().mockRejectedValue(new Error('Worker is invalid'));

      const result1 = await OCRErrorHandler.withErrorHandling(
        'test success',
        successOperation
      );
      expect(result1).toBe('success');

      // Test with recoverable error - should use fallback
      const result2 = await OCRErrorHandler.withErrorHandling(
        'test recoverable failure',
        recoverableFailure,
        'fallback'
      );
      expect(result2).toBe('fallback');

      // Test with unrecoverable error - should throw
      const unrecoverableFailure = vi.fn().mockRejectedValue(new Error('unknown error'));
      
      await expect(OCRErrorHandler.withErrorHandling(
        'test unrecoverable failure',
        unrecoverableFailure,
        'fallback'
      )).rejects.toThrow('unknown error');
    });

    it('should validate workers safely', async () => {
      const validWorker = {
        recognize: vi.fn().mockResolvedValue('result')
      };

      const result = await OCRErrorHandler.safeWorkerValidation(
        validWorker,
        () => validWorker.recognize(),
        ['recognize'],
        'test context'
      );

      expect(result).toBe('result');
    });
  });

  describe('OCRErrorUtils', () => {
    it('should create fallback languages', () => {
      const fallback = OCRErrorUtils.createFallbackLanguages();
      expect(fallback).toEqual(['eng']);
    });

    it('should determine when to clear worker cache', () => {
      const workerError = new Error('worker is null');
      const networkError = new Error('network failure');

      expect(OCRErrorUtils.shouldClearWorkerCache(workerError)).toBe(true);
      expect(OCRErrorUtils.shouldClearWorkerCache(networkError)).toBe(false);
    });

    it('should determine when to use CDN fallback', () => {
      const resourceError = new Error('loading language traineddata failed');
      const legacyError = new Error('worker.detect requires Legacy model');

      expect(OCRErrorUtils.shouldUseCDNFallback(resourceError)).toBe(true);
      expect(OCRErrorUtils.shouldUseCDNFallback(legacyError)).toBe(false);
    });

    it('should create timeout promises', async () => {
      const timeoutPromise = OCRErrorUtils.createTimeoutPromise(100, 'test operation');
      
      await expect(timeoutPromise).rejects.toThrow('test operation timeout after 100ms');
    });
  });

  describe('Integration patterns', () => {
    it('should handle common OCR error patterns like our services do', async () => {
      // Simulate the pattern used in LanguageDetectionService
      const mockWorker = null;
      
      try {
        if (!OCRErrorHandler.validateWorker(mockWorker, ['detect'])) {
          throw new Error('Worker is invalid or does not support detect method');
        }
      } catch (error) {
        const errorCategory = OCRErrorDetection.categorizeError(error);
        
        expect(errorCategory.isRecoverable).toBe(true);
        expect(errorCategory.category).toBe('worker_validation');
        
        if (OCRErrorDetection.isWorkerValidationError(error)) {
          const fallback = OCRErrorUtils.createFallbackLanguages();
          expect(fallback).toEqual(['eng']);
        }
      }
    });

    it('should handle legacy errors as our services do', () => {
      const legacyError = new Error('worker.detect requires Legacy model');
      const errorCategory = OCRErrorDetection.categorizeError(legacyError);
      
      expect(errorCategory.isRecoverable).toBe(true);
      expect(OCRErrorDetection.isLegacyError(legacyError)).toBe(true);
      expect(errorCategory.recommendedAction).toContain('legacy support');
    });
  });
});
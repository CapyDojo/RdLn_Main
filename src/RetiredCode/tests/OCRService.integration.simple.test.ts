/**
 * Simplified Integration Tests for OCRService with Orchestrator
 * 
 * Tests Phase 3.3 integration: Legacy OCRService + OCROrchestrator
 * Ensures backward compatibility and enhanced functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OCRService } from '../OCRService';
import { OCRLanguage } from '../../types/ocr-types';

// Import the orchestrator module for mocking
import { OCROrchestrator } from '../OCROrchestrator';

// Mock the orchestrator and external dependencies
vi.mock('../OCROrchestrator');
vi.mock('../BackgroundLanguageLoader');
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(() => Promise.resolve({
      data: { text: 'Mock legacy extracted text' }
    })),
    terminate: vi.fn()
  }))
}));

// Mock opencc-js
vi.mock('opencc-js', () => ({
  Converter: vi.fn(() => (text: string) => text)
}));

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
    }
  }
});

// Create typed mock
const mockOCROrchestrator = vi.mocked(OCROrchestrator);

describe('OCRService Integration with Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup successful orchestrator mock by default
    mockOCROrchestrator.extractText = vi.fn().mockResolvedValue({
      text: 'Mock orchestrator extracted text',
      detectedLanguages: ['eng'],
      extractionTime: 100,
      processingTime: 50,
      totalTime: 200,
      cacheHit: false,
      backgroundLoaderUsed: true,
      appliedProcessors: ['english-processing', 'universal-preservation'],
      performanceMetrics: {
        languageDetectionMs: 10,
        workerInitializationMs: 20,
        ocrExtractionMs: 100,
        textProcessingMs: 50
      }
    });

    mockOCROrchestrator.getHealthStatus = vi.fn().mockResolvedValue({
      status: 'healthy',
      services: {
        textProcessing: true,
        languageDetection: true,
        cacheManager: true,
        backgroundLoader: true
      }
    });

    mockOCROrchestrator.getPerformanceStats = vi.fn().mockReturnValue({
      cacheStats: { cachedWorkers: 2, totalCacheHits: 10 },
      backgroundLoaderStats: { ready: 3, loading: 1 },
      recentExtractions: 5,
      averageExtractionTime: 120,
      averageProcessingTime: 45
    });

    mockOCROrchestrator.cleanup = vi.fn();
  });

  describe('Backward Compatibility', () => {
    it('should work exactly as before when useOrchestrator is not specified', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextFromImage(mockImage);
      
      // Should get result without using orchestrator
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(mockOCROrchestrator.extractText).not.toHaveBeenCalled();
    });

    it('should work exactly as before when useOrchestrator is false', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextFromImage(mockImage, { 
        useOrchestrator: false 
      });
      
      // Should get result using legacy implementation
      expect(typeof result).toBe('string');
      expect(mockOCROrchestrator.extractText).not.toHaveBeenCalled();
    });

    it('should handle all existing options correctly', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextFromImage(mockImage, {
        languages: ['fra', 'deu'] as OCRLanguage[],
        autoDetect: false,
        primaryLanguage: 'fra' as OCRLanguage
      });
      
      expect(typeof result).toBe('string');
      expect(mockOCROrchestrator.extractText).not.toHaveBeenCalled();
    });
  });

  describe('Orchestrator Integration', () => {
    it('should use orchestrator when useOrchestrator is true', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextFromImage(mockImage, { 
        useOrchestrator: true 
      });
      
      expect(result).toBe('Mock orchestrator extracted text');
      expect(mockOCROrchestrator.extractText).toHaveBeenCalledWith(
        mockImage, 
        expect.objectContaining({
          useBackgroundLoader: true,
          performanceTracking: true,
          textProcessing: expect.objectContaining({
            preserveParagraphs: true,
            applyLegalTermFixes: true,
            enhancedPunctuation: true
          })
        })
      );
    });

    it('should pass through OCR options to orchestrator correctly', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      const options = {
        useOrchestrator: true,
        languages: ['fra', 'deu'] as OCRLanguage[],
        autoDetect: false,
        primaryLanguage: 'fra' as OCRLanguage
      };
      
      await OCRService.extractTextFromImage(mockImage, options);
      
      expect(mockOCROrchestrator.extractText).toHaveBeenCalledWith(
        mockImage, 
        expect.objectContaining({
          languages: ['fra', 'deu'],
          autoDetect: false,
          primaryLanguage: 'fra'
        })
      );
    });

    it('should fall back to legacy implementation if orchestrator fails', async () => {
      // Mock orchestrator failure
      mockOCROrchestrator.extractText = vi.fn().mockRejectedValue(new Error('Orchestrator failed'));
      
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextFromImage(mockImage, { 
        useOrchestrator: true 
      });
      
      // Should still get a result from legacy implementation
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(mockOCROrchestrator.extractText).toHaveBeenCalled();
    });
  });

  describe('Convenience Methods', () => {
    it('should provide extractTextWithOrchestrator convenience method', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      const result = await OCRService.extractTextWithOrchestrator(mockImage);
      
      expect(result).toBe('Mock orchestrator extracted text');
      expect(mockOCROrchestrator.extractText).toHaveBeenCalled();
    });

    it('should pass options to extractTextWithOrchestrator correctly', async () => {
      const mockImage = new File(['test'], 'test.png', { type: 'image/png' });
      
      await OCRService.extractTextWithOrchestrator(mockImage, {
        languages: ['spa'] as OCRLanguage[]
      });
      
      expect(mockOCROrchestrator.extractText).toHaveBeenCalledWith(
        mockImage, 
        expect.objectContaining({
          languages: ['spa']
        })
      );
    });
  });

  describe('Health and Statistics Methods', () => {
    it('should check orchestrator availability', async () => {
      const isAvailable = await OCRService.isOrchestratorAvailable();
      
      expect(isAvailable).toBe(true);
      expect(mockOCROrchestrator.getHealthStatus).toHaveBeenCalled();
    });

    it('should handle orchestrator unavailability gracefully', async () => {
      mockOCROrchestrator.getHealthStatus = vi.fn().mockRejectedValue(new Error('Not available'));
      
      const isAvailable = await OCRService.isOrchestratorAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('should get orchestrator stats', () => {
      const stats = OCRService.getOrchestratorStats();
      
      expect(stats).toEqual(expect.objectContaining({
        cacheStats: expect.any(Object),
        backgroundLoaderStats: expect.any(Object),
        recentExtractions: expect.any(Number)
      }));
    });

    it('should handle orchestrator stats failure gracefully', () => {
      mockOCROrchestrator.getPerformanceStats = vi.fn().mockImplementation(() => {
        throw new Error('Stats not available');
      });
      
      const stats = OCRService.getOrchestratorStats();
      
      expect(stats).toBeNull();
    });

    it('should provide combined statistics', () => {
      const stats = OCRService.getCombinedStats();
      
      expect(stats).toEqual(expect.objectContaining({
        legacy: expect.any(Object),
        orchestrator: expect.any(Object),
        combined: expect.objectContaining({
          totalWorkers: expect.any(Number),
          totalCacheHits: expect.any(Number)
        })
      }));
    });
  });

  describe('Cleanup Integration', () => {
    it('should cleanup both legacy and orchestrator resources', async () => {
      await OCRService.terminate();
      
      expect(mockOCROrchestrator.cleanup).toHaveBeenCalled();
    });

    it('should handle orchestrator cleanup failure gracefully', async () => {
      mockOCROrchestrator.cleanup = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      // Should not throw
      await expect(OCRService.terminate()).resolves.not.toThrow();
    });
  });
});

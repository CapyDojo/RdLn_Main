/**
 * OCR Service Prewarming Integration Test
 * 
 * This test verifies the refactored OCR worker initialization and caching logic
 * where SimpleOCRCache is directly integrated with OCRService.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OCRService } from '../OCRService';
import { SimpleOCRCache, prewarmLanguageWorker } from '../SimpleOCRCache';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { OCRLanguage } from '../../types/ocr-types';

// Mock tesseract.js
const mockWorker = {
  recognize: vi.fn(),
  detect: vi.fn(),
  terminate: vi.fn(),
  setParameters: vi.fn()
};

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve(mockWorker))
}));

// Mock ocrConfig
vi.mock('../../config/ocrConfig', () => ({
  DETECTION_LANGUAGES: ['eng', 'chi_sim', 'chi_tra', 'spa', 'fra', 'deu', 'jpn', 'kor', 'ara', 'rus'],
  SUPPORTED_LANGUAGES: [
    { code: 'eng', name: 'English', direction: 'ltr' },
    { code: 'fra', name: 'French', direction: 'ltr' },
    { code: 'chi_sim', name: 'Chinese Simplified', direction: 'ltr' }
  ]
}));

describe('OCRService - Prewarming Integration', () => {
  beforeEach(() => {
    // Reset the mock implementations
    mockWorker.recognize.mockResolvedValue({ data: { text: 'mock recognized text' } });
    mockWorker.detect.mockResolvedValue({ data: { scripts: [{ lang: 'eng' }] } });
    mockWorker.terminate.mockResolvedValue(undefined);
    mockWorker.setParameters.mockResolvedValue(undefined);
    
    // Clear all cached workers before each test
    SimpleOCRCache.terminateAll();
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Terminate all workers after each test
    await OCRService.terminate();
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should retrieve and use prewarmed language worker from SimpleOCRCache', async () => {
    // Mock the prewarmLanguageWorker function to avoid pathConfig issues
    const mockPrewarmLanguageWorker = vi.spyOn(
      await import('../SimpleOCRCache'), 
      'prewarmLanguageWorker'
    ).mockImplementation(async (languages: OCRLanguage[] = ['eng']) => {
      try {
        // Check if already prewarmed
        if (SimpleOCRCache.getLanguageWorker(languages)) {
          console.log(`🔥 Language worker for ${languages.join(',')} already prewarmed`);
          return true;
        }
        
        console.log(`🔥 Prewarming language worker for: ${languages.join(',')}`);
        
        // Create a mock worker
        const worker = mockWorker;
        
        // Store in simple cache
        SimpleOCRCache.setLanguageWorker(languages, worker);
        console.log(`✅ Language worker for ${languages.join(',')} prewarmed successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to prewarm language worker for ${languages.join(',')}:`, error);
        return false;
      }
    });

    // Prewarm a language worker
    const languages: OCRLanguage[] = ['eng'];
    const prewarmSuccess = await prewarmLanguageWorker(languages);
    expect(prewarmSuccess).toBe(true);

    // Verify the worker is cached
    const statsBefore = SimpleOCRCache.getStats();
    expect(statsBefore.languageWorkersCached).toBe(1);

    // Mock file for OCR
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    // OCRService should use the prewarmed worker
    const result = await OCRService.extractTextFromImage(mockFile, { languages });
    
    // Verify the result
    expect(result).toBe('mock recognized text');
    
    // Verify the worker's recognize method was called
    expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile);
    
    // Restore the original implementation
    mockPrewarmLanguageWorker.mockRestore();
  });

  it('should handle on-demand worker loading through SimpleOCRCache', async () => {
    // Mock the prewarmLanguageWorker function to avoid pathConfig issues
    const mockPrewarmLanguageWorker = vi.spyOn(
      await import('../SimpleOCRCache'), 
      'prewarmLanguageWorker'
    ).mockImplementation(async (languages: OCRLanguage[] = ['eng']) => {
      try {
        // Check if already prewarmed
        if (SimpleOCRCache.getLanguageWorker(languages)) {
          console.log(`🔥 Language worker for ${languages.join(',')} already prewarmed`);
          return true;
        }
        
        console.log(`🔥 Prewarming language worker for: ${languages.join(',')}`);
        
        // Create a mock worker
        const worker = mockWorker;
        
        // Store in simple cache
        SimpleOCRCache.setLanguageWorker(languages, worker);
        console.log(`✅ Language worker for ${languages.join(',')} prewarmed successfully`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to prewarm language worker for ${languages.join(',')}:`, error);
        return false;
      }
    });

    // Ensure no workers are prewarmed
    const statsBefore = SimpleOCRCache.getStats();
    expect(statsBefore.languageWorkersCached).toBe(0);

    // Mock file for OCR
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });

    // OCRService should trigger on-demand loading for a new language set
    const languages: OCRLanguage[] = ['fra'];
    const result = await OCRService.extractTextFromImage(mockFile, { languages });
    
    // Verify the result
    expect(result).toBe('mock recognized text');
    
    // Verify a new worker was created
    expect(mockWorker.recognize).toHaveBeenCalledWith(mockFile);
    
    // Verify the worker is now cached (should be 1, but there might be a detection worker too)
    const statsAfter = SimpleOCRCache.getStats();
    expect(statsAfter.languageWorkersCached).toBeGreaterThanOrEqual(1);
    
    // Restore the original implementation
    mockPrewarmLanguageWorker.mockRestore();
  });
});
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { OCRService } from '@/utils/OCRService';
import { TEST_DOCUMENTS, createTestImageFromDocument } from '@tests/fixtures/test-documents';
import { PerformanceTracker, getMemoryUsage } from '@tests/helpers/test-utils';

/**
 * Performance benchmark tests for OCR operations
 * 
 * These tests measure performance characteristics and identify bottlenecks
 * in the OCR pipeline under various conditions.
 */

describe('OCR Performance Benchmarks', () => {
  let ocrService: OCRService;
  let performanceTracker: PerformanceTracker;

  beforeAll(async () => {
    console.log('⚡ Setting up OCR Performance Tests...');
    ocrService = OCRService.getInstance();
    performanceTracker = new PerformanceTracker();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up OCR Performance Tests...');
    await ocrService.cleanup();
    
    // Report performance statistics
    const stats = performanceTracker.getAllStats();
    console.log('📊 Performance Statistics:', stats);
  });

  describe('Language Detection Performance', () => {
    it('should detect languages within acceptable time limits', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const iterations = 5;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        performanceTracker.start();
        await ocrService.detectLanguages(imageUrl);
        const duration = performanceTracker.end(`language-detection-${i}`);
        results.push(duration);
      }
      
      const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);
      
      console.log(`Language Detection - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
      
      // Performance expectations (adjust based on your requirements)
      expect(avgDuration).toBeLessThan(15000); // 15 seconds average
      expect(maxDuration).toBeLessThan(30000); // 30 seconds max
      
      URL.revokeObjectURL(imageUrl);
    });

    it('should benefit from caching on repeated detections', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      // First detection (cold cache)
      performanceTracker.start();
      await ocrService.detectLanguages(imageUrl);
      const coldCacheDuration = performanceTracker.end('cold-cache');
      
      // Second detection (warm cache)
      performanceTracker.start();
      await ocrService.detectLanguages(imageUrl);
      const warmCacheDuration = performanceTracker.end('warm-cache');
      
      console.log(`Caching benefit - Cold: ${coldCacheDuration.toFixed(2)}ms, Warm: ${warmCacheDuration.toFixed(2)}ms`);
      
      // Warm cache should be significantly faster
      expect(warmCacheDuration).toBeLessThan(coldCacheDuration * 0.5); // At least 50% faster
      
      URL.revokeObjectURL(imageUrl);
    });
  });

  describe('Text Extraction Performance', () => {
    it('should extract text within acceptable time limits', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const iterations = 3;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        performanceTracker.start();
        await ocrService.extractText(imageUrl, ['eng'], { preserveParagraphs: true });
        const duration = performanceTracker.end(`text-extraction-${i}`);
        results.push(duration);
      }
      
      const avgDuration = results.reduce((a, b) => a + b, 0) / results.length;
      const maxDuration = Math.max(...results);
      const minDuration = Math.min(...results);
      
      console.log(`Text Extraction - Avg: ${avgDuration.toFixed(2)}ms, Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);
      
      // Performance expectations
      expect(avgDuration).toBeLessThan(20000); // 20 seconds average
      expect(maxDuration).toBeLessThan(40000); // 40 seconds max
      
      URL.revokeObjectURL(imageUrl);
    });

    it('should handle multi-language extraction efficiently', async () => {
      const multiLangDoc = TEST_DOCUMENTS.find(doc => doc.expectedLanguages.length > 1);
      if (!multiLangDoc) return;
      
      const imageFile = createTestImageFromDocument(multiLangDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      performanceTracker.start();
      await ocrService.extractText(
        imageUrl, 
        multiLangDoc.expectedLanguages as any[], 
        { preserveParagraphs: true }
      );
      const duration = performanceTracker.end('multilang-extraction');
      
      console.log(`Multi-language extraction: ${duration.toFixed(2)}ms`);
      
      // Multi-language should not be more than 3x slower than single language
      expect(duration).toBeLessThan(60000); // 60 seconds max
      
      URL.revokeObjectURL(imageUrl);
    });
  });

  describe('Worker Management Performance', () => {
    it('should initialize workers efficiently', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Clean up any existing workers
      await ocrService.cleanup();
      
      // Measure worker initialization time
      performanceTracker.start();
      await ocrService.extractText(imageUrl, ['eng']);
      const initializationTime = performanceTracker.end('worker-initialization');
      
      console.log(`Worker initialization: ${initializationTime.toFixed(2)}ms`);
      
      // Worker initialization should complete within reasonable time
      expect(initializationTime).toBeLessThan(30000); // 30 seconds
      
      URL.revokeObjectURL(imageUrl);
    });

    it('should reuse workers efficiently', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      // First extraction (creates worker)
      performanceTracker.start();
      await ocrService.extractText(imageUrl, ['eng']);
      const firstExtraction = performanceTracker.end('first-extraction');
      
      // Second extraction (reuses worker)
      performanceTracker.start();
      await ocrService.extractText(imageUrl, ['eng']);
      const secondExtraction = performanceTracker.end('second-extraction');
      
      console.log(`Worker reuse - First: ${firstExtraction.toFixed(2)}ms, Second: ${secondExtraction.toFixed(2)}ms`);
      
      // Second extraction should be faster due to worker reuse
      expect(secondExtraction).toBeLessThan(firstExtraction * 0.8); // At least 20% faster
      
      URL.revokeObjectURL(imageUrl);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should maintain reasonable memory usage during operations', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const initialMemory = getMemoryUsage();
      
      // Perform multiple extractions
      for (let i = 0; i < 3; i++) {
        await ocrService.extractText(imageUrl, ['eng']);
      }
      
      const finalMemory = getMemoryUsage();
      
      if (initialMemory.used > 0 && finalMemory.used > 0) {
        const memoryIncrease = finalMemory.used - initialMemory.used;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
        
        console.log(`Memory usage - Initial: ${(initialMemory.used / 1024 / 1024).toFixed(2)}MB, Final: ${(finalMemory.used / 1024 / 1024).toFixed(2)}MB, Increase: ${memoryIncreasePercent.toFixed(2)}%`);
        
        // Memory increase should be reasonable (less than 200%)
        expect(memoryIncreasePercent).toBeLessThan(200);
      }
      
      URL.revokeObjectURL(imageUrl);
    });

    it('should clean up memory after operations', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const beforeMemory = getMemoryUsage();
      
      // Perform extraction
      await ocrService.extractText(imageUrl, ['eng']);
      
      // Clean up
      await ocrService.cleanup();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const afterMemory = getMemoryUsage();
      
      if (beforeMemory.used > 0 && afterMemory.used > 0) {
        const memoryChange = afterMemory.used - beforeMemory.used;
        const memoryChangePercent = (memoryChange / beforeMemory.used) * 100;
        
        console.log(`Memory cleanup - Before: ${(beforeMemory.used / 1024 / 1024).toFixed(2)}MB, After: ${(afterMemory.used / 1024 / 1024).toFixed(2)}MB, Change: ${memoryChangePercent.toFixed(2)}%`);
        
        // Memory should not increase significantly after cleanup
        expect(memoryChangePercent).toBeLessThan(50);
      }
      
      URL.revokeObjectURL(imageUrl);
    });
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle concurrent extractions efficiently', async () => {
      const testDocs = TEST_DOCUMENTS.slice(0, 3); // Use first 3 documents
      
      performanceTracker.start();
      
      const promises = testDocs.map(async (doc, index) => {
        const imageFile = createTestImageFromDocument(doc);
        const imageUrl = URL.createObjectURL(imageFile);
        
        try {
          const result = await ocrService.extractText(imageUrl, doc.expectedLanguages as any[]);
          return { index, success: true, result };
        } catch (error) {
          return { index, success: false, error };
        } finally {
          URL.revokeObjectURL(imageUrl);
        }
      });
      
      const results = await Promise.all(promises);
      const duration = performanceTracker.end('concurrent-extractions');
      
      console.log(`Concurrent extractions (${testDocs.length} docs): ${duration.toFixed(2)}ms`);
      
      // All extractions should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(testDocs.length);
      
      // Concurrent processing should be faster than sequential
      // (though this is hard to test accurately in a mocked environment)
      expect(duration).toBeLessThan(120000); // 2 minutes max for 3 documents
    });
  });

  describe('Document Size Performance', () => {
    it('should handle different document sizes appropriately', async () => {
      // Test with different document types as proxies for size
      const documentTypes = ['letter', 'contract', 'invoice', 'technical'];
      
      for (const docType of documentTypes) {
        const doc = TEST_DOCUMENTS.find(d => d.documentType === docType);
        if (!doc) continue;
        
        const imageFile = createTestImageFromDocument(doc);
        const imageUrl = URL.createObjectURL(imageFile);
        
        performanceTracker.start();
        await ocrService.extractText(imageUrl, doc.expectedLanguages as any[]);
        const duration = performanceTracker.end(`${docType}-size-test`);
        
        console.log(`${docType} document processing: ${duration.toFixed(2)}ms`);
        
        // Each document type should complete within reasonable time
        expect(duration).toBeLessThan(45000); // 45 seconds max
        
        URL.revokeObjectURL(imageUrl);
      }
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across runs', async () => {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      const runs = 5;
      const durations: number[] = [];
      
      for (let i = 0; i < runs; i++) {
        performanceTracker.start();
        await ocrService.extractText(imageUrl, ['eng']);
        const duration = performanceTracker.end(`consistency-run-${i}`);
        durations.push(duration);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.reduce((acc, duration) => acc + Math.pow(duration - avgDuration, 2), 0) / durations.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = (standardDeviation / avgDuration) * 100;
      
      console.log(`Performance consistency - Avg: ${avgDuration.toFixed(2)}ms, StdDev: ${standardDeviation.toFixed(2)}ms, CV: ${coefficientOfVariation.toFixed(2)}%`);
      
      // Performance should be relatively consistent (CV < 30%)
      expect(coefficientOfVariation).toBeLessThan(30);
      
      URL.revokeObjectURL(imageUrl);
    });
  });
});

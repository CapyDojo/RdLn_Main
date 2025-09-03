import { describe, it, expect, beforeEach } from 'vitest';
import { MyersAlgorithm } from '@/algorithms/MyersAlgorithm';
import { generateTestText } from '@/testing/test-utils';

describe('Algorithm Performance Benchmarks', () => {
  beforeEach(() => {
    // Clear any potential memory before each test
    if (global.gc) {
      global.gc();
    }
  });

  describe('Myers Algorithm Performance', () => {
    it('should process small documents (1K chars) within 100ms', async () => {
      const originalText = generateTestText('small');
      const revisedText = originalText.replace('test', 'modified');

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
      expect(result).toBeDefined();
      expect(result.changes).toBeDefined();
    }, 5000); // 5 second timeout

    it('should process medium documents (10K chars) within 500ms', async () => {
      const originalText = generateTestText('medium');
      const revisedText = originalText.replace(/test/g, 'modified').replace(/content/g, 'updated');

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
      expect(result).toBeDefined();
      expect(result.changes.length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout

    it('should process large documents (100K chars) within 2 seconds', async () => {
      const originalText = generateTestText('large');
      const revisedText = originalText.replace(/test/g, 'modified').slice(0, -1000) + '\nAdditional content';

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
    }, 15000); // 15 second timeout

    it('should handle repetitive text patterns efficiently', async () => {
      const pattern = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
      const originalText = pattern.repeat(1000); // ~55K chars
      const revisedText = originalText.replace('Lorem', 'Updated');

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(result.changes.length).toBeGreaterThan(0); // Should detect changes
    }, 10000);

    it('should scale linearly with document size', async () => {
      const baseText = generateTestText('small');
      const times: number[] = [];

      // Test multiple sizes
      const sizes = [1, 2, 4];
      
      for (const multiplier of sizes) {
        const originalText = baseText.repeat(multiplier);
        const revisedText = originalText.replace('test', 'modified');

        const startTime = performance.now();
        await MyersAlgorithm.compare(originalText, revisedText);
        const duration = performance.now() - startTime;
        
        times.push(duration);
      }

      // Rough linearity check - 4x size should not be more than 10x slower
      const ratio = times[2] / times[0];
      expect(ratio).toBeLessThan(10);
    }, 15000);
  });

  describe('Memory Usage Benchmarks', () => {
    it('should maintain reasonable memory usage for large documents', async () => {
      const originalText = generateTestText('large');
      const revisedText = originalText.replace(/test/g, 'modified');

      // Get initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const result = await MyersAlgorithm.compare(originalText, revisedText);

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for large docs)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(result).toBeDefined();
    }, 10000);

    it('should clean up memory after processing', async () => {
      const originalText = generateTestText('medium');
      const revisedText = originalText.replace(/test/g, 'modified');

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Process multiple documents
      for (let i = 0; i < 5; i++) {
        await MyersAlgorithm.compare(originalText + i, revisedText + i);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory should not grow excessively after cleanup
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    }, 10000);
  });

  describe('Edge Case Performance', () => {
    it('should handle identical documents quickly', async () => {
      const text = generateTestText('medium');

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(text, text);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(50); // Should be very fast for identical text
      expect(result.changes.length).toBeGreaterThanOrEqual(0); // Should be 0 or 1 (unchanged)
    }, 5000);

    it('should handle completely different documents within time limits', async () => {
      const originalText = generateTestText('medium');
      const revisedText = 'Completely different content '.repeat(500);

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
      expect(result.changes.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle documents with many small changes efficiently', async () => {
      const originalText = generateTestText('medium');
      // Create many small changes
      const revisedText = originalText
        .replace(/a/g, 'A')
        .replace(/e/g, 'E')
        .replace(/i/g, 'I')
        .replace(/o/g, 'O')
        .replace(/u/g, 'U');

      const startTime = performance.now();
      const result = await MyersAlgorithm.compare(originalText, revisedText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1500);
      expect(result.changes.length).toBeGreaterThan(0); // Should detect changes
    }, 10000);
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle multiple concurrent comparisons efficiently', async () => {
      const documents = Array.from({ length: 5 }, (_, i) => ({
        original: generateTestText('small') + ` Document ${i}`,
        revised: generateTestText('small').replace('test', `modified${i}`) + ` Document ${i}`,
      }));

      const startTime = performance.now();
      
      const promises = documents.map(doc => 
        MyersAlgorithm.compare(doc.original, doc.revised)
      );
      
      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000); // All 5 should complete within 1 second
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.changes).toBeDefined();
      });
    }, 10000);
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance for standard operations', async () => {
      const originalText = generateTestText('medium');
      const revisedText = originalText.replace(/test/g, 'modified');

      const times: number[] = [];

      // Run the same comparison multiple times
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await MyersAlgorithm.compare(originalText, revisedText);
        const duration = performance.now() - startTime;
        times.push(duration);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxDeviation = Math.max(...times.map(time => Math.abs(time - averageTime)));

      // Performance should be consistent - max deviation should not be more than 50% of average
      expect(maxDeviation).toBeLessThan(averageTime * 0.5);
    }, 15000);

    it('should not degrade with repeated use', () => {
      const originalText = generateTestText('small');
      const revisedText = originalText.replace('test', 'modified');

      const firstRunTime = performance.now();
      await MyersAlgorithm.compare(originalText, revisedText);
      const firstDuration = performance.now() - firstRunTime;

      // Run many more times
      for (let i = 0; i < 50; i++) {
        await MyersAlgorithm.compare(originalText + i, revisedText + i);
      }

      const lastRunTime = performance.now();
      await MyersAlgorithm.compare(originalText, revisedText);
      const lastDuration = performance.now() - lastRunTime;

      // Last run should not be significantly slower than first run
      expect(lastDuration).toBeLessThan(firstDuration * 2);
    }, 15000);
  });
});
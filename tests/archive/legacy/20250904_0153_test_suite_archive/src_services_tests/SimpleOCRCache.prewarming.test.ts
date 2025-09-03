/**
 * Simple test file for OCR prewarming functionality
 * 
 * This test verifies that the prewarming functions can be imported and executed
 * without errors.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleOCRCache } from '../SimpleOCRCache';

describe('SimpleOCRCache - Basic Tests', () => {
  beforeEach(() => {
    // Clear all cached workers before each test
    SimpleOCRCache.terminateAll();
  });

  afterEach(() => {
    // Clear all cached workers after each test
    SimpleOCRCache.terminateAll();
  });

  it('should be able to import SimpleOCRCache', () => {
    expect(SimpleOCRCache).toBeDefined();
  });

  it('should have terminateAll method', () => {
    expect(typeof SimpleOCRCache.terminateAll).toBe('function');
  });

  it('should have getStats method', () => {
    expect(typeof SimpleOCRCache.getStats).toBe('function');
  });

  it('should return stats object', () => {
    const stats = SimpleOCRCache.getStats();
    expect(stats).toBeDefined();
    expect(typeof stats).toBe('object');
    expect(stats.detectionWorkerCached).toBeDefined();
    expect(stats.languageWorkersCached).toBeDefined();
    expect(stats.totalWorkers).toBeDefined();
  });

  it('should be able to terminate all workers', async () => {
    // This should not throw an error even if no workers are cached
    await expect(SimpleOCRCache.terminateAll()).resolves.not.toThrow();
  });
});
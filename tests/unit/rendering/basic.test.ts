import { describe, it, expect, beforeEach } from 'vitest';
import { setupRenderingTest } from './setup';

describe('Basic Rendering Test Setup', () => {
  beforeEach(() => {
    setupRenderingTest();
  });

  it('should setup test environment correctly', () => {
    // Test that our mocks are in place
    expect(window.IntersectionObserver).toBeDefined();
    expect(window.ResizeObserver).toBeDefined();
    expect(performance.now).toBeDefined();
  });

  it('should create mock documents of different sizes', async () => {
    const { createMockDocument, createMockDiff } = await import('./setup');
    
    const smallDoc = createMockDocument('small');
    const largeDoc = createMockDocument('large');
    
    expect(smallDoc.length).toBeGreaterThan(0);
    expect(largeDoc.length).toBeGreaterThan(smallDoc.length);
    
    const fewChanges = createMockDiff('few');
    const manyChanges = createMockDiff('many');
    
    expect(fewChanges.length).toBe(10);
    expect(manyChanges.length).toBe(1000);
  });
});

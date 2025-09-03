import React, { ComponentType, ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// ===========================
// PROVIDER WRAPPER UTILITIES
// ===========================

/**
 * Creates a test wrapper with multiple providers
 */
export const createTestWrapper = (providers: Array<ComponentType<any>> = []) => {
  return ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
};

/**
 * Render component with providers
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    providers?: Array<ComponentType<any>>;
  }
) => {
  const { providers = [], ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: createTestWrapper(providers),
    ...renderOptions,
  });
};

// ===========================
// MOCK FACTORIES
// ===========================

/**
 * Create a mock image file for testing
 */
export const createMockImageFile = (
  size = 1024,
  name = 'test-image.png',
  type = 'image/png'
): File => {
  const content = 'a'.repeat(size);
  return new File([content], name, { type });
};

/**
 * Create a mock text file for testing
 */
export const createMockTextFile = (
  content = 'test content',
  name = 'test.txt',
  type = 'text/plain'
): File => {
  return new File([content], name, { type });
};

/**
 * Create a mock DOCX file for testing
 */
export const createMockDocxFile = (
  content = 'test docx content',
  name = 'test.docx'
): File => {
  return new File([content], name, { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
};

/**
 * Create mock diff changes for testing
 */
export const createMockChanges = (count = 5) => {
  return Array.from({ length: count }, (_, i) => ({
    type: i % 2 === 0 ? 'insertion' : 'deletion',
    content: `Change ${i + 1}`,
    originalIndex: i,
    revisedIndex: i % 2 === 0 ? i : undefined,
  }));
};

/**
 * Create mock performance metrics
 */
export const createMockPerformanceMetrics = () => ({
  duration: 1000,
  memoryUsage: 50000,
  renderTime: 100,
  diffTime: 500,
  timestamp: Date.now(),
});

// ===========================
// TEST DATA GENERATORS
// ===========================

/**
 * Generate test text of specified size
 */
export const generateTestText = (size: 'small' | 'medium' | 'large' | 'xlarge' = 'small') => {
  const baseSizes = {
    small: 100,
    medium: 1000,
    large: 10000,
    xlarge: 100000,
  };
  
  const targetSize = baseSizes[size];
  const baseText = 'This is a test sentence with some content. ';
  const repetitions = Math.ceil(targetSize / baseText.length);
  
  return Array(repetitions).fill(baseText).join('').slice(0, targetSize);
};

/**
 * Generate mock comparison result
 */
export const generateMockComparison = (changeCount = 5) => ({
  changes: createMockChanges(changeCount),
  stats: {
    additions: Math.floor(changeCount / 2),
    deletions: Math.ceil(changeCount / 2),
    unchanged: 100,
    changed: changeCount,
    totalChanges: changeCount,
  },
  performance: createMockPerformanceMetrics(),
});

// ===========================
// ASYNC TEST UTILITIES
// ===========================

/**
 * Wait for a specified time (useful for testing async operations)
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock promise that resolves after a delay
 */
export const createDelayedPromise = <T,>(value: T, delay = 100): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(value), delay));
};

/**
 * Create a mock promise that rejects after a delay
 */
export const createDelayedRejection = (error: Error, delay = 100): Promise<never> => {
  return new Promise((_, reject) => setTimeout(() => reject(error), delay));
};

// ===========================
// MOCK EVENT UTILITIES
// ===========================

/**
 * Create a mock drag event
 */
export const createMockDragEvent = (files: File[] = []) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  dataTransfer: {
    files,
    items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    types: ['Files'],
  },
});

/**
 * Create a mock file input change event
 */
export const createMockFileChangeEvent = (files: File[] = []) => ({
  target: {
    files,
  },
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

// ===========================
// ASSERTION HELPERS
// ===========================

/**
 * Check if a function was called with specific arguments
 */
export const expectCalledWith = (mockFn: any, ...args: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...args);
};

/**
 * Check if a function was called a specific number of times
 */
export const expectCalledTimes = (mockFn: any, times: number) => {
  expect(mockFn).toHaveBeenCalledTimes(times);
};

// Re-export common testing utilities
export * from '@testing-library/react';
export * from '@testing-library/user-event';
export { vi } from 'vitest';
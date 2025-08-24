import { vi } from 'vitest';

// Mock DOM APIs that are commonly used in rendering tests
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  });
  return mockIntersectionObserver;
};

// Mock ResizeObserver for virtual scrolling tests
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  });
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  });
  return mockResizeObserver;
};

// Mock scrolling behavior
export const mockScrolling = () => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    writable: true,
    value: vi.fn(),
  });
  
  Object.defineProperty(Element.prototype, 'scrollTo', {
    writable: true,
    value: vi.fn(),
  });
  
  Object.defineProperty(Element.prototype, 'scrollTop', {
    writable: true,
    value: 0,
  });
  
  Object.defineProperty(Element.prototype, 'scrollHeight', {
    writable: true,
    value: 1000,
  });
  
  Object.defineProperty(Element.prototype, 'clientHeight', {
    writable: true,
    value: 500,
  });
};

// Performance measurement utilities
export const measureRenderTime = async (renderFn: () => Promise<void> | void): Promise<number> => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

export const createMockDocument = (size: 'small' | 'medium' | 'large' | 'xlarge'): string => {
  const baseParagraph = "This is a sample paragraph with multiple sentences. It contains various words and punctuation marks. The content is designed to simulate real document text with reasonable length and complexity.";
  
  const sizes = {
    small: 5,      // ~500 words
    medium: 50,    // ~5,000 words  
    large: 500,    // ~50,000 words
    xlarge: 2000   // ~200,000 words
  };
  
  const paragraphCount = sizes[size];
  const paragraphs = Array.from({ length: paragraphCount }, (_, i) => 
    `${baseParagraph} This is paragraph ${i + 1} of ${paragraphCount}.`
  );
  
  return paragraphs.join('\n\n');
};

export const createMockDiff = (changeCount: 'few' | 'moderate' | 'many' | 'extreme'): Array<{type: 'added' | 'removed' | 'unchanged', text: string}> => {
  const baseText = "Sample text content for testing purposes.";
  
  const changeCounts = {
    few: 10,       // 10 changes
    moderate: 100, // 100 changes
    many: 1000,    // 1,000 changes
    extreme: 10000 // 10,000 changes
  };
  
  const count = changeCounts[changeCount];
  const changes = [];
  
  for (let i = 0; i < count; i++) {
    const changeType = i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'unchanged';
    changes.push({
      type: changeType as 'added' | 'removed' | 'unchanged',
      text: `${baseText} Change ${i + 1}.`
    });
  }
  
  return changes;
};

// Setup function to run before each test
export const setupRenderingTest = () => {
  mockIntersectionObserver();
  mockResizeObserver();
  mockScrolling();
  
  // Mock performance.now if not available
  if (!globalThis.performance) {
    globalThis.performance = {
      now: () => Date.now(),
    } as Performance;
  }
};

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { ExperimentalLayoutProvider } from '../src/contexts/ExperimentalLayoutContext';

vi.mock('../src/utils/env', () => ({
  isTauri: false,
}));

// RedlineOutput mock removed - tests should use actual component

// Mock IntersectionObserver globally
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Set environment for tests
process.env.NODE_ENV = 'development';

// Mock appConfig globally for tests
vi.mock('../src/config/appConfig', () => ({
  UI_CONFIG: {
    RENDERING: {
      CHUNK_SIZE: 1000,
      ESTIMATED_CHUNK_HEIGHT: 5000,
      INTERSECTION_MARGIN: '200px',
      SEMANTIC_CHUNKING: {
        ENABLED: true,
        MAX_CONSECUTIVE_SAME_TYPE: 50,
        PRESERVE_WORD_BOUNDARIES: true,
        PRESERVE_NUMBER_PARENTHESES: true,
      },
    },
    ANIMATION: {
      COPY_SUCCESS_DURATION: 2000,
      CANCELLATION_FEEDBACK_DELAY: 500,
    },
  },
  STORAGE_CONFIG: {
    KEYS: {
      AUTO_COMPARE_ENABLED: 'rdln_auto_compare_enabled',
      SYSTEM_PROTECTION_ENABLED: 'rdln_system_protection_enabled',
    },
    DEFAULTS: {
      AUTO_COMPARE_ENABLED: true,
      SYSTEM_PROTECTION_ENABLED: true,
    },
  },
  SYSTEM_CONFIG: {
    LIMITS: {
      MAX_DOCUMENT_LENGTH: 10000000,
      COMPLEX_DOCUMENT_THRESHOLD: 1000000,
      COMPLEX_CHANGES_THRESHOLD: 100000,
      MIN_AVAILABLE_MEMORY: 100000000,
      LARGE_OPERATION_THRESHOLD: 5000000,
      LARGE_OPERATION_COOLDOWN: 5000,
    },
  },
  FEATURE_FLAGS: {
    ENABLE_CHUNKED_RENDERING: true,
    ENABLE_SEMANTIC_CHUNKING: true,
  },
  DEV_CONFIG: {
    DEBUGGING: {
      SEMANTIC_CHUNKING_DEBUG: false,
    },
  },
  appConfig: {
    env: {
      IS_DEVELOPMENT: true,
    },
  },
}));

// Mock Canvas API (simplified)
const createMockCanvas = () => ({
  getContext: () => ({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    fillRect: () => {},
    canvas: { width: 100, height: 100 }
  }),
  toDataURL: () => 'data:image/png;base64,mock',
  width: 100,
  height: 100
});

// Mock HTML Canvas Element
global.HTMLCanvasElement = createMockCanvas as any;
global.createCanvas = createMockCanvas;

// Mock Image constructor (simplified)
global.Image = class {
  onload: ((event: Event) => void) | null = null;
  src = '';
  width = 100;
  height = 100;
} as any;

// Mock FileReader (simplified)
global.FileReader = class {
  onload: ((event: ProgressEvent) => void) | null = null;
  result: string | ArrayBuffer | null = null;
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,mock';
      if (this.onload) this.onload({} as ProgressEvent);
    }, 0);
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(8);
      if (this.onload) this.onload({} as ProgressEvent);
    }, 0);
  }
} as any;

// Mock Blob (simplified)
if (!global.Blob) {
  global.Blob = class {
    size = 0;
    type = '';
    constructor(chunks: any[] = [], options: any = {}) {
      this.type = options.type || '';
    }
  } as any;
}

// Mock URL
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
} as any;

// Mock tesseract.js (simplified)
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    load: vi.fn(),
    loadLanguage: vi.fn(),
    initialize: vi.fn(),
    recognize: vi.fn(() => Promise.resolve({ data: { text: 'mock text' }})),
    terminate: vi.fn(() => Promise.resolve())
  }))
}));

// Mock usePerformanceMonitor hook (simplified)
vi.mock('../src/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: vi.fn(() => ({
    trackOperation: vi.fn((name, operation) => operation()),
    isEnabled: true
  })),
  useInteractionTracking: vi.fn(() => ({
    trackInteraction: vi.fn(() => () => {})
  })),
  usePerformanceDebugger: vi.fn(() => ({
    isEnabled: false,
    logMetric: vi.fn()
  }))
}));

// Test environment setup
beforeAll(async () => {
  console.log('🧪 Setting up OCR test environment...');
  
  // Suppress console warnings for tests unless explicitly testing them
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Parameter not found:') || message.includes('React DevTools')) {
      return; // Suppress known development warnings
    }
    originalWarn.apply(console, args);
  };
});

afterAll(async () => {
  console.log('🧪 Cleaning up OCR test environment...');
});

beforeEach(() => {
  // Clear any existing timers or intervals
  vi.clearAllTimers();
  
  // Clear any global abort signals to prevent unhandled promises
  try {
    (globalThis as any).currentAbortSignal = null;
  } catch (error) {
    // Ignore cleanup errors
  }
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
  
  // Clear any hanging timeouts that might cause unhandled promise rejections
  vi.clearAllTimers();
  
  // Reset any global abort signals
  try {
    (globalThis as any).currentAbortSignal = null;
  } catch (error) {
    // Ignore cleanup errors
  }
  
  // Clear any pending async operations
  return new Promise(resolve => setTimeout(resolve, 0));
});

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { ExperimentalLayoutProvider } from '../src/contexts/ExperimentalLayoutContext';

// Mock EnhancedRedlineOutput
vi.mock('../src/components/EnhancedRedlineOutput', () => ({
  EnhancedRedlineOutput: vi.fn((props) => {
    return React.createElement('div', null, 'Mock EnhancedRedlineOutput');
  }),
}));

// Set environment for tests
process.env.NODE_ENV = 'development';

// Mock appConfig globally for tests
vi.mock('../config/appConfig', () => ({
  appConfig: {
    env: {
      IS_DEVELOPMENT: true,
    },
  },
}));

// Mock Canvas API for JSDOM environment
const createMockCanvas = () => {
  const canvas = {
    getContext: () => ({
      drawImage: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      moveTo: () => {},
      lineTo: () => {},
      save: () => {},
      restore: () => {},
      scale: () => {},
      rotate: () => {},
      translate: () => {},
      transform: () => {},
      setTransform: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      measureText: () => ({ width: 10 }),
      canvas: { width: 100, height: 100 }
    }),
    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    toBlob: (callback: (blob: Blob | null) => void) => {
      const blob = new Blob(['test'], { type: 'image/png' });
      callback(blob);
    },
    width: 100,
    height: 100
  };
  return canvas;
};

// Mock HTML Canvas Element
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: function() {
    return createMockCanvas();
  },
  writable: true
});

// Mock Canvas constructor for node-canvas
global.createCanvas = createMockCanvas;

// Mock Image constructor
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.width = 100;
    this.height = 100;
  }
  
  set src(value: string) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) this.onload({} as Event);
    }, 0);
  }
  
  get src() {
    return this._src;
  }
  
  private _src = '';
} as any;

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  
  readAsDataURL(file: Blob) {
    setTimeout(() => {
      this.result = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      if (this.onload) this.onload({} as ProgressEvent);
    }, 0);
  }

  readAsArrayBuffer(file: Blob) {
    setTimeout(() => {
      // Mock a simple ArrayBuffer for testing purposes
      this.result = new ArrayBuffer(8); // A small buffer
      if (this.onload) this.onload({} as ProgressEvent);
    }, 0);
  }
  
  onload: ((event: ProgressEvent) => void) | null = null;
  onerror: ((event: ProgressEvent) => void) | null = null;
  result: string | ArrayBuffer | null = null;
} as any;

// Mock Blob
if (!global.Blob) {
  global.Blob = class {
    constructor(chunks: any[], options: any = {}) {
      this.size = 0;
      this.type = options.type || '';
    }
    size: number;
    type: string;
  } as any;
}

// Mock Blob.prototype.arrayBuffer
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function() {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else if (typeof reader.result === 'string') {
          // Basic conversion for data URL strings if needed, though ArrayBuffer is preferred
          const base64 = reader.result.split(',')[1];
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          resolve(bytes.buffer);
        } else {
          resolve(new ArrayBuffer(0)); // Resolve with empty buffer if result is not ArrayBuffer or string
        }
      };
      reader.readAsArrayBuffer(this);
    });
  };
}

// Mock File.prototype.arrayBuffer (File inherits from Blob)
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = function() {
    return Blob.prototype.arrayBuffer.call(this);
  };
}

// Mock URL.createObjectURL
global.URL = {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(() => {}),
  } as any;

// Mock tesseract.js
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => ({
    load: vi.fn(),
    loadLanguage: vi.fn(),
    initialize: vi.fn(),
    recognize: vi.fn(() => Promise.resolve({ data: { text: 'mock text' }})),
    terminate: vi.fn(() => Promise.resolve()),
    get  progress() { return 0.5; }, // Mock progress
    set progress(value) { /* do nothing */ },
  })),
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
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

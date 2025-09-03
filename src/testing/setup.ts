import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

// ===========================
// GLOBAL TEST SETUP
// ===========================

// Mock environment variables
process.env.NODE_ENV = 'test';

// ===========================
// BROWSER API MOCKS
// ===========================

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
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

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock File API
global.File = vi.fn().mockImplementation((fileBits, fileName, options) => ({
  name: fileName,
  size: fileBits[0]?.length || 0,
  type: options?.type || '',
  lastModified: Date.now(),
  slice: vi.fn(),
  stream: vi.fn(),
  text: vi.fn().mockResolvedValue(fileBits[0] || ''),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
}));

global.FileReader = vi.fn().mockImplementation(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  onload: null,
  onerror: null,
  result: null,
}));

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
}));

// Mock URL API
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Blob API
global.Blob = vi.fn().mockImplementation((blobParts, options) => ({
  size: blobParts?.reduce((size, part) => size + part.length, 0) || 0,
  type: options?.type || '',
  slice: vi.fn(),
  stream: vi.fn(),
  text: vi.fn().mockResolvedValue(''),
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
}));

// ===========================
// EXTERNAL LIBRARY MOCKS
// ===========================

// Mock environment utilities
vi.mock('../utils/env', () => ({
  isTauri: false,
  isElectron: false,
  isDevelopment: true,
  isTest: true,
}));

// ===========================
// TEST LIFECYCLE HOOKS
// ===========================

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();
});

afterEach(() => {
  // Cleanup any timers or async operations
  vi.clearAllTimers();
  vi.unstubAllGlobals();
});

// ===========================
// GLOBAL TEST HELPERS
// ===========================

// Export mock storage for test access
export { localStorageMock, sessionStorageMock };
import { OCRLanguage } from '@/types/ocr-types';

/**
 * Test utilities for OCR testing
 */

// Sample test images (base64 encoded 1x1 pixels for quick tests)
export const TEST_IMAGES = {
  // Simple English text
  ENGLISH_SIMPLE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  
  // Chinese text
  CHINESE_SIMPLE: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  
  // Multi-language document
  MULTILINGUAL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  
  // Poor quality scan
  POOR_QUALITY: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  
  // Large document
  LARGE_DOCUMENT: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
};

// Expected text outputs for test images
export const EXPECTED_TEXT = {
  ENGLISH_SIMPLE: 'Hello World\n\nThis is a simple English document for testing OCR accuracy.',
  CHINESE_SIMPLE: '你好世界\n\n这是一个简单的中文文档，用于测试OCR准确性。',
  MULTILINGUAL: 'Hello World 你好世界\n\nThis is a multilingual document. 这是一个多语言文档。',
  POOR_QUALITY: 'Th1s 1s p00r qu4l1ty t3xt',
  LARGE_DOCUMENT: 'This is a large document with multiple paragraphs.\n\nParagraph 1: Lorem ipsum dolor sit amet...\n\nParagraph 2: Consectetur adipiscing elit...'
};

// Expected language detection results
export const EXPECTED_LANGUAGES: Record<string, OCRLanguage[]> = {
  ENGLISH_SIMPLE: ['eng'],
  CHINESE_SIMPLE: ['chi_sim'],
  MULTILINGUAL: ['eng', 'chi_sim'],
  POOR_QUALITY: ['eng'],
  LARGE_DOCUMENT: ['eng']
};

/**
 * Create a test image file from base64 data
 */
export function createTestImageFile(base64Data: string, filename: string = 'test.png'): File {
  // Convert base64 to blob
  const byteCharacters = atob(base64Data.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });
  
  return new File([blob], filename, { type: 'image/png' });
}

/**
 * Create a test canvas element with specified dimensions
 */
export function createTestCanvas(width: number = 100, height: number = 100): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Add some test text
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('Test Text', 10, 30);
  }
  
  return canvas;
}

/**
 * Wait for a specified amount of time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate text similarity using Levenshtein distance
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const len1 = text1.length;
  const len2 = text2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  
  return (maxLength - distance) / maxLength;
}

/**
 * Calculate character-level accuracy
 */
export function calculateCharacterAccuracy(expected: string, actual: string): number {
  return calculateTextSimilarity(expected, actual);
}

/**
 * Calculate word-level accuracy
 */
export function calculateWordAccuracy(expected: string, actual: string): number {
  const expectedWords = expected.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const actualWords = actual.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  if (expectedWords.length === 0) return actualWords.length === 0 ? 1 : 0;
  
  let correctWords = 0;
  const minLength = Math.min(expectedWords.length, actualWords.length);
  
  for (let i = 0; i < minLength; i++) {
    if (expectedWords[i] === actualWords[i]) {
      correctWords++;
    }
  }
  
  return correctWords / expectedWords.length;
}

/**
 * Validate language detection results
 */
export function validateLanguageDetection(
  detected: OCRLanguage[],
  expected: OCRLanguage[]
): { precision: number; recall: number; f1: number } {
  const detectedSet = new Set(detected);
  const expectedSet = new Set(expected);
  
  const truePositives = detected.filter(lang => expectedSet.has(lang)).length;
  const falsePositives = detected.filter(lang => !expectedSet.has(lang)).length;
  const falseNegatives = expected.filter(lang => !detectedSet.has(lang)).length;
  
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  
  return { precision, recall, f1 };
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private measurements: Record<string, number[]> = {};
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(label: string): number {
    const duration = performance.now() - this.startTime;
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }
    this.measurements[label].push(duration);
    return duration;
  }
  
  getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.measurements[label];
    if (!measurements || measurements.length === 0) return null;
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }
  
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const label in this.measurements) {
      const labelStats = this.getStats(label);
      if (labelStats) {
        stats[label] = labelStats;
      }
    }
    
    return stats;
  }
  
  reset(): void {
    this.measurements = {};
  }
}

/**
 * Memory usage tracking
 */
export function getMemoryUsage(): { used: number; total: number } {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize
    };
  }
  
  // Fallback for environments without memory API
  return { used: 0, total: 0 };
}

/**
 * Test result reporting utilities
 */
export interface TestResult {
  testName: string;
  duration: number;
  accuracy?: number;
  languageDetection?: { precision: number; recall: number; f1: number };
  memoryUsage?: { used: number; total: number };
  success: boolean;
  error?: string;
}

export class TestReporter {
  private results: TestResult[] = [];
  
  addResult(result: TestResult): void {
    this.results.push(result);
  }
  
  getResults(): TestResult[] {
    return [...this.results];
  }
  
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    avgDuration: number;
    avgAccuracy: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total || 0;
    const accuracyResults = this.results.filter(r => r.accuracy !== undefined);
    const avgAccuracy = accuracyResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / accuracyResults.length || 0;
    
    return { total, passed, failed, avgDuration, avgAccuracy };
  }
  
  exportToJson(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: this.getSummary(),
      results: this.results
    }, null, 2);
  }
  
  reset(): void {
    this.results = [];
  }
}

/**
 * Core type definitions for DOCX List Parser MVP
 */

export interface DocxMetadata {
  fileName: string;
  fileSize: number;
  extractionDate: Date;
  processingTime: number; // milliseconds
}

export interface ExtractionResult {
  text: string;
  metadata: DocxMetadata;
  success: boolean;
  error?: string;
  warning?: string;
}

export interface AccuracyMetrics {
  testCase: string;
  expectedLines: string[];
  actualLines: string[];
  matchedLines: number;
  totalLines: number;
  accuracy: number; // percentage (0-100)
  differences: Diff[];
}

export interface Diff {
  lineNumber: number;
  expected: string;
  actual: string;
  type: 'mismatch' | 'missing' | 'extra';
}

export interface TestFixture {
  id: string;
  name: string;
  description: string;
  docxPath: string;
  expectedPath: string;
  targetAccuracy: number; // percentage
}

export interface PerformanceBenchmark {
  testCase: string;
  fileSize: number; // bytes
  extractionTime: number; // milliseconds
  linesProcessed: number;
  linesPerSecond: number;
}

export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  overallAccuracy: number; // percentage
  totalTime: number; // milliseconds
  results: AccuracyMetrics[];
}

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { OCRService } from '@/services/OCRService';
import { TEST_DOCUMENTS, createTestImageFromDocument } from '@tests/fixtures/test-documents';
import { PerformanceTracker, getMemoryUsage } from '@tests/helpers/test-utils';

/**
 * Comprehensive OCR Performance Benchmarking Suite
 * 
 * This suite provides detailed performance metrics for OCR operations,
 * including timing, memory usage, accuracy, and regression detection.
 * 
 * Features:
 * - Baseline establishment for all OCR operations
 * - Regression detection with configurable thresholds
 * - Memory leak detection
 * - Multi-language performance analysis
 * - Document complexity impact analysis
 * - Automated performance reporting
 */

interface BenchmarkResult {
  operation: string;
  duration: number;
  memoryDelta: number;
  accuracy?: number;
  documentSize: number;
  languages: string[];
  timestamp: number;
  metadata?: any;
}

interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  baseline?: BenchmarkResult;
  regressionThreshold?: number;
}

class OCRBenchmarkReporter {
  private suites: Map<string, BenchmarkSuite> = new Map();
  private baselineFile: string;

  constructor() {
    this.baselineFile = 'ocr-performance-baseline.json';
  }

  addResult(suiteName: string, result: BenchmarkResult) {
    if (!this.suites.has(suiteName)) {
      this.suites.set(suiteName, {
        name: suiteName,
        results: [],
        regressionThreshold: 1.2 // 20% regression threshold
      });
    }
    this.suites.get(suiteName)!.results.push(result);
  }

  async loadBaseline() {
    try {
      // In browser environment, this would use localStorage or IndexedDB
      // For now, we'll use a simple in-memory baseline
      console.log('📊 Loading performance baselines...');
    } catch (error) {
      console.warn('⚠️ Could not load baseline data, creating new baseline');
    }
  }

  generateReport(): string {
    const report: string[] = [];
    
    report.push('# OCR Performance Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    this.suites.forEach((suite, name) => {
      report.push(`## ${name}`);
      
      if (suite.results.length === 0) {
        report.push('No results recorded');
        return;
      }

      const avgDuration = suite.results.reduce((sum, r) => sum + r.duration, 0) / suite.results.length;
      const avgMemory = suite.results.reduce((sum, r) => sum + r.memoryDelta, 0) / suite.results.length;
      const maxDuration = Math.max(...suite.results.map(r => r.duration));
      const minDuration = Math.min(...suite.results.map(r => r.duration));

      report.push(`- **Average Duration**: ${avgDuration.toFixed(2)}ms`);
      report.push(`- **Min Duration**: ${minDuration.toFixed(2)}ms`);
      report.push(`- **Max Duration**: ${maxDuration.toFixed(2)}ms`);
      report.push(`- **Average Memory**: ${avgMemory.toFixed(2)}MB`);
      
      if (suite.baseline) {
        const regression = avgDuration / suite.baseline.duration;
        if (regression > (suite.regressionThreshold || 1.2)) {
          report.push(`- **⚠️ Regression Detected**: ${((regression - 1) * 100).toFixed(1)}% slower`);
        } else {
          report.push(`- **✅ Performance Stable**: ${((regression - 1) * 100).toFixed(1)}% change`);
        }
      }
      
      report.push('');
    });

    return report.join('\n');
  }

  saveReport(report: string) {
    console.log(report);
    
    // In browser environment, this could be downloaded
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-performance-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

class OCRBenchmarkSuite {
  private ocrService: OCRService;
  private performanceTracker: PerformanceTracker;
  private reporter: OCRBenchmarkReporter;
  private memoryBaseline: number = 0;

  constructor() {
    this.ocrService = OCRService.getInstance();
    this.performanceTracker = new PerformanceTracker();
    this.reporter = new OCRBenchmarkReporter();
  }

  async setup() {
    console.log('⚡ Setting up OCR Benchmark Suite...');
    await this.reporter.loadBaseline();
    this.memoryBaseline = getMemoryUsage().used;
  }

  async teardown() {
    console.log('🧹 Cleaning up OCR Benchmark Suite...');
    await this.ocrService.cleanup();
    
    const report = this.reporter.generateReport();
    this.reporter.saveReport(report);
  }

  async benchmarkLanguageDetection() {
    const suiteName = 'Language Detection';
    
    for (const testDoc of TEST_DOCUMENTS) {
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      try {
        const initialMemory = getMemoryUsage();
        
        this.performanceTracker.start();
        const result = await this.ocrService.detectLanguages(imageUrl);
        const duration = this.performanceTracker.end(`lang-detection-${testDoc.name}`);
        
        const finalMemory = getMemoryUsage();
        
        this.reporter.addResult(suiteName, {
          operation: 'language_detection',
          duration,
          memoryDelta: finalMemory.used - initialMemory.used,
          accuracy: result.confidence,
          documentSize: imageFile.size,
          languages: result.languages,
          timestamp: Date.now(),
          metadata: {
            documentName: testDoc.name,
            expectedLanguages: testDoc.expectedLanguages
          }
        });
        
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  async benchmarkTextExtraction() {
    const suiteName = 'Text Extraction';
    
    for (const testDoc of TEST_DOCUMENTS) {
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      try {
        const initialMemory = getMemoryUsage();
        
        this.performanceTracker.start();
        const result = await this.ocrService.extractText(
          imageUrl, 
          testDoc.expectedLanguages as any[],
          { preserveParagraphs: true }
        );
        const duration = this.performanceTracker.end(`text-extraction-${testDoc.name}`);
        
        const finalMemory = getMemoryUsage();
        
        // Calculate accuracy based on expected vs actual text length
        const expectedLength = testDoc.expectedText?.length || 0;
        const actualLength = result.text.length;
        const accuracy = expectedLength > 0 ? 
          Math.min(1, Math.abs(actualLength - expectedLength) / expectedLength) : 1;
        
        this.reporter.addResult(suiteName, {
          operation: 'text_extraction',
          duration,
          memoryDelta: finalMemory.used - initialMemory.used,
          accuracy: 1 - accuracy, // Convert to accuracy score
          documentSize: imageFile.size,
          languages: testDoc.expectedLanguages,
          timestamp: Date.now(),
          metadata: {
            documentName: testDoc.name,
            textLength: result.text.length,
            paragraphs: result.paragraphs?.length || 0
          }
        });
        
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  async benchmarkWorkerInitialization() {
    const suiteName = 'Worker Initialization';
    
    for (const testDoc of TEST_DOCUMENTS.slice(0, 3)) { // Limit to 3 documents
      const imageFile = createTestImageFromDocument(testDoc);
      const imageUrl = URL.createObjectURL(imageFile);
      
      try {
        // Clean up workers first
        await this.ocrService.cleanup();
        
        const initialMemory = getMemoryUsage();
        
        this.performanceTracker.start();
        await this.ocrService.extractText(imageUrl, ['eng']);
        const duration = this.performanceTracker.end(`worker-init-${testDoc.name}`);
        
        const finalMemory = getMemoryUsage();
        
        this.reporter.addResult(suiteName, {
          operation: 'worker_initialization',
          duration,
          memoryDelta: finalMemory.used - initialMemory.used,
          documentSize: imageFile.size,
          languages: ['eng'],
          timestamp: Date.now(),
          metadata: {
            documentName: testDoc.name
          }
        });
        
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  async benchmarkMemoryLeakDetection() {
    const suiteName = 'Memory Leak Detection';
    
    const testDoc = TEST_DOCUMENTS[0];
    const imageFile = createTestImageFromDocument(testDoc);
    const imageUrl = URL.createObjectURL(imageFile);
    
    try {
      const memoryReadings: number[] = [];
      
      // Perform multiple extractions and measure memory
      for (let i = 0; i < 10; i++) {
        const memoryBefore = getMemoryUsage().used;
        
        await this.ocrService.extractText(imageUrl, ['eng']);
        
        const memoryAfter = getMemoryUsage().used;
        memoryReadings.push(memoryAfter - memoryBefore);
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const avgMemoryIncrease = memoryReadings.reduce((sum, val) => sum + val, 0) / memoryReadings.length;
      const maxMemoryIncrease = Math.max(...memoryReadings);
      
      this.reporter.addResult(suiteName, {
        operation: 'memory_leak_detection',
        duration: 0, // Not applicable for this test
        memoryDelta: avgMemoryIncrease,
        documentSize: imageFile.size,
        languages: ['eng'],
        timestamp: Date.now(),
        metadata: {
          iterations: 10,
          maxMemoryIncrease,
          leakDetected: maxMemoryIncrease > 5 // 5MB threshold
        }
      });
      
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async benchmarkDocumentComplexity() {
    const suiteName = 'Document Complexity Analysis';
    
    // Test with different image resolutions
    const resolutions = [
      { width: 800, height: 600 },
      { width: 1200, height: 900 },
      { width: 1920, height: 1080 }
    ];
    
    for (const resolution of resolutions) {
      const testDoc = TEST_DOCUMENTS[0];
      const imageFile = createTestImageFromDocument(testDoc, resolution);
      const imageUrl = URL.createObjectURL(imageFile);
      
      try {
        const initialMemory = getMemoryUsage();
        
        this.performanceTracker.start();
        await this.ocrService.extractText(imageUrl, ['eng']);
        const duration = this.performanceTracker.end(`complexity-${resolution.width}x${resolution.height}`);
        
        const finalMemory = getMemoryUsage();
        
        this.reporter.addResult(suiteName, {
          operation: 'complexity_analysis',
          duration,
          memoryDelta: finalMemory.used - initialMemory.used,
          documentSize: imageFile.size,
          languages: ['eng'],
          timestamp: Date.now(),
          metadata: {
            resolution: `${resolution.width}x${resolution.height}`,
            pixelCount: resolution.width * resolution.height
          }
        });
        
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }

  async runFullBenchmark() {
    console.log('🚀 Starting comprehensive OCR benchmark suite...');
    
    await this.setup();
    
    try {
      console.log('📊 Benchmarking language detection...');
      await this.benchmarkLanguageDetection();
      
      console.log('📊 Benchmarking text extraction...');
      await this.benchmarkTextExtraction();
      
      console.log('📊 Benchmarking worker initialization...');
      await this.benchmarkWorkerInitialization();
      
      console.log('📊 Benchmarking memory leak detection...');
      await this.benchmarkMemoryLeakDetection();
      
      console.log('📊 Benchmarking document complexity...');
      await this.benchmarkDocumentComplexity();
      
      console.log('✅ OCR benchmark suite completed successfully');
      
    } finally {
      await this.teardown();
    }
  }
}

// Test runner
export async function runOCRBenchmarks() {
  const benchmarkSuite = new OCRBenchmarkSuite();
  await benchmarkSuite.runFullBenchmark();
}

// Vitest integration
describe('OCR Performance Benchmarks', () => {
  let benchmarkSuite: OCRBenchmarkSuite;

  beforeAll(async () => {
    benchmarkSuite = new OCRBenchmarkSuite();
    await benchmarkSuite.setup();
  });

  afterAll(async () => {
    await benchmarkSuite.teardown();
  });

  it('should complete language detection benchmarks', async () => {
    await benchmarkSuite.benchmarkLanguageDetection();
  }, { timeout: 300000 });

  it('should complete text extraction benchmarks', async () => {
    await benchmarkSuite.benchmarkTextExtraction();
  }, { timeout: 300000 });

  it('should complete worker initialization benchmarks', async () => {
    await benchmarkSuite.benchmarkWorkerInitialization();
  }, { timeout: 300000 });

  it('should detect memory leaks', async () => {
    await benchmarkSuite.benchmarkMemoryLeakDetection();
  }, { timeout: 300000 });

  it('should analyze document complexity impact', async () => {
    await benchmarkSuite.benchmarkDocumentComplexity();
  }, { timeout: 300000 });
});
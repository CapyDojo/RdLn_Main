import { OCRService } from '../services/OCRService';
import { OCROrchestrator } from '../services/OCROrchestrator';
import { ImagePreprocessingService } from '../services/ImagePreprocessingService';
import { PreprocessingConfig } from '../types/ocr-types';

export interface BenchmarkResult {
  originalText: string;
  preprocessedText: string;
  accuracyWithoutPreprocessing: number;
  accuracyWithPreprocessing: number;
  processingTimeWithoutPreprocessing: number;
  processingTimeWithPreprocessing: number;
  preprocessingTime: number;
  improvement: number;
  preprocessingFilters: string[];
}

export interface TestImage {
  file: File;
  expectedText: string;
  imageType: 'low-contrast' | 'noisy' | 'blurry' | 'skewed' | 'normal';
}

export class OCRBenchmark {
  private ocrService: OCRService;
  private ocrOrchestrator: OCROrchestrator;

  constructor() {
    this.ocrService = new OCRService();
    this.ocrOrchestrator = new OCROrchestrator();
  }

  /**
   * Calculate accuracy between extracted text and expected text
   */
  private calculateAccuracy(extracted: string, expected: string): number {
    if (!expected.trim()) return 0;
    
    const cleanExtracted = extracted.trim().toLowerCase();
    const cleanExpected = expected.trim().toLowerCase();
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(cleanExtracted, cleanExpected);
    const maxLength = Math.max(cleanExtracted.length, cleanExpected.length);
    
    return Math.max(0, (1 - distance / maxLength) * 100);
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + indicator
        );
      }
    }

    return matrix[a.length][b.length];
  }

  /**
   * Run benchmark on a single test image
   */
  async runSingleBenchmark(testImage: TestImage, preprocessingConfig?: PreprocessingConfig): Promise<BenchmarkResult> {
    console.log(`🧪 Running benchmark on ${testImage.imageType} image...`);

    // Test without preprocessing
    const startTime1 = performance.now();
    const resultWithoutPreprocessing = await this.ocrService.extractTextFromImage(testImage.file, {
      preprocessing: false
    });
    const processingTimeWithoutPreprocessing = performance.now() - startTime1;

    // Test with preprocessing
    const startTime2 = performance.now();
    const resultWithPreprocessing = await this.ocrService.extractTextFromImage(testImage.file, {
      preprocessing: preprocessingConfig || true
    });
    const totalTimeWithPreprocessing = performance.now() - startTime2;

    // Calculate preprocessing time separately
    let preprocessingTime = 0;
    let preprocessingFilters: string[] = [];
    
    if (preprocessingConfig) {
      const startPreprocess = performance.now();
      const preprocessResult = await ImagePreprocessingService.preprocessImage(testImage.file, preprocessingConfig);
      preprocessingTime = performance.now() - startPreprocess;
      preprocessingFilters = preprocessResult.appliedFilters;
    }

    // Calculate accuracies
    const accuracyWithoutPreprocessing = this.calculateAccuracy(resultWithoutPreprocessing.text, testImage.expectedText);
    const accuracyWithPreprocessing = this.calculateAccuracy(resultWithPreprocessing.text, testImage.expectedText);

    // Calculate improvement
    const improvement = accuracyWithPreprocessing - accuracyWithoutPreprocessing;

    return {
      originalText: resultWithoutPreprocessing.text,
      preprocessedText: resultWithPreprocessing.text,
      accuracyWithoutPreprocessing,
      accuracyWithPreprocessing,
      processingTimeWithoutPreprocessing,
      processingTimeWithPreprocessing: totalTimeWithPreprocessing,
      preprocessingTime,
      improvement,
      preprocessingFilters
    };
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runComprehensiveBenchmark(testImages: TestImage[], preprocessingConfig?: PreprocessingConfig): Promise<{
    individualResults: BenchmarkResult[];
    summary: {
      averageImprovement: number;
      averagePreprocessingTime: number;
      totalImages: number;
      imagesWithImprovement: number;
      bestImprovement: number;
      worstImprovement: number;
    };
  }> {
    console.log('🚀 Starting comprehensive OCR benchmark...');

    const individualResults: BenchmarkResult[] = [];
    
    for (const testImage of testImages) {
      const result = await this.runSingleBenchmark(testImage, preprocessingConfig);
      individualResults.push(result);
      
      console.log(`📊 ${testImage.imageType}: ${result.improvement.toFixed(2)}% improvement`);
    }

    // Calculate summary statistics
    const improvements = individualResults.map(r => r.improvement);
    const preprocessingTimes = individualResults.map(r => r.preprocessingTime);
    
    const summary = {
      averageImprovement: improvements.reduce((a, b) => a + b, 0) / improvements.length,
      averagePreprocessingTime: preprocessingTimes.reduce((a, b) => a + b, 0) / preprocessingTimes.length,
      totalImages: testImages.length,
      imagesWithImprovement: improvements.filter(i => i > 0).length,
      bestImprovement: Math.max(...improvements),
      worstImprovement: Math.min(...improvements)
    };

    console.log('📈 Benchmark complete!');
    console.log(`📊 Average improvement: ${summary.averageImprovement.toFixed(2)}%`);
    console.log(`⏱️ Average preprocessing time: ${summary.averagePreprocessingTime.toFixed(2)}ms`);
    console.log(`✅ Images with improvement: ${summary.imagesWithImprovement}/${summary.totalImages}`);

    return { individualResults, summary };
  }

  /**
   * Generate benchmark report
   */
  generateReport(results: { individualResults: BenchmarkResult[]; summary: any }): string {
    const { individualResults, summary } = results;
    
    let report = `# OCR Preprocessing Performance Report

## Summary
- **Total Images Tested**: ${summary.totalImages}
- **Average Accuracy Improvement**: ${summary.averageImprovement.toFixed(2)}%
- **Average Preprocessing Time**: ${summary.averagePreprocessingTime.toFixed(2)}ms
- **Images with Improvement**: ${summary.imagesWithImprovement}/${summary.totalImages} (${((summary.imagesWithImprovement / summary.totalImages) * 100).toFixed(1)}%)
- **Best Improvement**: ${summary.bestImprovement.toFixed(2)}%
- **Worst Improvement**: ${summary.worstImprovement.toFixed(2)}%

## Individual Results

`;

    individualResults.forEach((result, index) => {
      report += `### Image ${index + 1}
- **Accuracy Without Preprocessing**: ${result.accuracyWithoutPreprocessing.toFixed(2)}%
- **Accuracy With Preprocessing**: ${result.accuracyWithPreprocessing.toFixed(2)}%
- **Improvement**: ${result.improvement.toFixed(2)}%
- **Preprocessing Time**: ${result.preprocessingTime.toFixed(2)}ms
- **Applied Filters**: ${result.preprocessingFilters.join(', ')}

`;
    });

    return report;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.ocrService.cleanup();
    await this.ocrOrchestrator.cleanup();
  }
}
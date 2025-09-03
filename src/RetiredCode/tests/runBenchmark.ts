import { OCRBenchmark } from './OCRBenchmark';
import { TestImage } from './OCRBenchmark';
import { PERFORMANCE_PREPROCESSING_CONFIG, ACCURACY_PREPROCESSING_CONFIG } from '../config/ocrConfig';

/**
 * Example usage and demonstration of OCR benchmarking
 */
export async function runExampleBenchmark() {
  console.log('🚀 Starting OCR Preprocessing Benchmark Demo');
  
  const benchmark = new OCRBenchmark();
  
  try {
    // Create sample test images (in real usage, these would be actual File objects)
    const testImages: TestImage[] = [
      {
        file: new File([''], 'low-contrast-test.jpg', { type: 'image/jpeg' }),
        expectedText: 'This is a test document with low contrast text.',
        imageType: 'low-contrast'
      },
      {
        file: new File([''], 'noisy-test.jpg', { type: 'image/jpeg' }),
        expectedText: 'This document contains noisy background patterns.',
        imageType: 'noisy'
      },
      {
        file: new File([''], 'blurry-test.jpg', { type: 'image/jpeg' }),
        expectedText: 'Blurry text that needs sharpening for better recognition.',
        imageType: 'blurry'
      }
    ];
    
    console.log('📊 Running benchmark with default preprocessing...');
    const defaultResults = await benchmark.runComprehensiveBenchmark(testImages);
    
    console.log('\n📊 Running benchmark with performance-focused preprocessing...');
    const performanceResults = await benchmark.runComprehensiveBenchmark(testImages, PERFORMANCE_PREPROCESSING_CONFIG);
    
    console.log('\n📊 Running benchmark with accuracy-focused preprocessing...');
    const accuracyResults = await benchmark.runComprehensiveBenchmark(testImages, ACCURACY_PREPROCESSING_CONFIG);
    
    // Generate reports
    const defaultReport = benchmark.generateReport(defaultResults);
    const performanceReport = benchmark.generateReport(performanceResults);
    const accuracyReport = benchmark.generateReport(accuracyResults);
    
    console.log('\n=== DEFAULT PREPROCESSING REPORT ===');
    console.log(defaultReport);
    
    console.log('\n=== PERFORMANCE PREPROCESSING REPORT ===');
    console.log(performanceReport);
    
    console.log('\n=== ACCURACY PREPROCESSING REPORT ===');
    console.log(accuracyReport);
    
    // Summary comparison
    console.log('\n=== SUMMARY COMPARISON ===');
    console.log(`Default Config: ${defaultResults.summary.averageImprovement.toFixed(2)}% avg improvement`);
    console.log(`Performance Config: ${performanceResults.summary.averageImprovement.toFixed(2)}% avg improvement`);
    console.log(`Accuracy Config: ${accuracyResults.summary.averageImprovement.toFixed(2)}% avg improvement`);
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  } finally {
    await benchmark.cleanup();
    console.log('✅ Benchmark completed and resources cleaned up');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExampleBenchmark().catch(console.error);
}
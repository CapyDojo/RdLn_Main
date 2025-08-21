#!/usr/bin/env node

/**
 * Comprehensive test runner for image preprocessing functionality
 * This script runs all preprocessing tests and generates detailed reports
 */

import { ImagePreprocessingService } from '../services/ImagePreprocessingService';
import { PreprocessingConfig } from '../config/ocrConfig';
import { createTestCanvas, createTextPatternCanvas, createNoisyCanvas, createLowContrastCanvas, getImageStats, compareCanvases } from './preprocessing-test-utils';

interface TestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class PreprocessingTestRunner {
  private results: TestResult[] = [];
  private preprocessingService: ImagePreprocessingService;

  constructor() {
    this.preprocessingService = new ImagePreprocessingService();
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Image Preprocessing Test Suite...\n');

    const tests = [
      this.testBasicGrayscaleConversion,
      this.testAdaptiveThresholding,
      this.testNoiseReduction,
      this.testContrastEnhancement,
      this.testGaussianBlur,
      this.testImageSharpening,
      this.testImageResizing,
      this.testFullPreprocessingPipeline,
      this.testPerformanceMetrics,
      this.testConfigurationValidation
    ];

    for (const test of tests) {
      try {
        console.log(`Running ${test.name}...`);
        const startTime = Date.now();
        await test.call(this);
        const duration = Date.now() - startTime;
        console.log(`✅ ${test.name} passed (${duration}ms)\n`);
      } catch (error) {
        const duration = Date.now() - (this.results[this.results.length - 1]?.duration || Date.now());
        console.log(`❌ ${test.name} failed: ${error.message} (${duration}ms)\n`);
        this.results.push({
          testName: test.name,
          passed: false,
          duration,
          error: error.message
        });
      }
    }

    this.generateReport();
  }

  private async testBasicGrayscaleConversion(): Promise<void> {
    const originalCanvas = createTestCanvas(100, 100, '#FF0000');
    const grayscaleCanvas = await this.preprocessingService.applyGrayscale(originalCanvas);
    
    const stats = getImageStats(grayscaleCanvas);
    
    this.results.push({
      testName: 'testBasicGrayscaleConversion',
      passed: Math.abs(stats.brightness - 76.5) < 1, // Red converts to ~76.5 gray
      duration: 0,
      details: { brightness: stats.brightness }
    });
  }

  private async testAdaptiveThresholding(): Promise<void> {
    const canvas = createTextPatternCanvas(200, 100);
    const thresholded = await this.preprocessingService.applyAdaptiveThreshold(canvas, 11, 2);
    
    const stats = getImageStats(thresholded);
    
    this.results.push({
      testName: 'testAdaptiveThresholding',
      passed: stats.contrast > 200, // Should have high contrast after thresholding
      duration: 0,
      details: { contrast: stats.contrast }
    });
  }

  private async testNoiseReduction(): Promise<void> {
    const noisyCanvas = createNoisyCanvas(100, 100);
    const denoised = await this.preprocessingService.applyNoiseReduction(noisyCanvas, 5);
    
    const noisyStats = getImageStats(noisyCanvas);
    const denoisedStats = getImageStats(denoised);
    
    // Noise reduction should decrease entropy
    this.results.push({
      testName: 'testNoiseReduction',
      passed: denoisedStats.entropy < noisyStats.entropy,
      duration: 0,
      details: { 
        originalEntropy: noisyStats.entropy,
        denoisedEntropy: denoisedStats.entropy 
      }
    });
  }

  private async testContrastEnhancement(): Promise<void> {
    const lowContrast = createLowContrastCanvas(100, 100);
    const enhanced = await this.preprocessingService.applyContrastEnhancement(lowContrast, 1.5);
    
    const originalStats = getImageStats(lowContrast);
    const enhancedStats = getImageStats(enhanced);
    
    this.results.push({
      testName: 'testContrastEnhancement',
      passed: enhancedStats.contrast > originalStats.contrast,
      duration: 0,
      details: {
        originalContrast: originalStats.contrast,
        enhancedContrast: enhancedStats.contrast
      }
    });
  }

  private async testGaussianBlur(): Promise<void> {
    const canvas = createTextPatternCanvas(100, 100);
    const blurred = await this.preprocessingService.applyGaussianBlur(canvas, 3);
    
    const originalStats = getImageStats(canvas);
    const blurredStats = getImageStats(blurred);
    
    // Blur should reduce contrast slightly
    this.results.push({
      testName: 'testGaussianBlur',
      passed: blurredStats.contrast < originalStats.contrast,
      duration: 0,
      details: {
        originalContrast: originalStats.contrast,
        blurredContrast: blurredStats.contrast
      }
    });
  }

  private async testImageSharpening(): Promise<void> {
    const canvas = createTextPatternCanvas(100, 100);
    const blurred = await this.preprocessingService.applyGaussianBlur(canvas, 2);
    const sharpened = await this.preprocessingService.applySharpen(blurred, 1.5);
    
    const blurredStats = getImageStats(blurred);
    const sharpenedStats = getImageStats(sharpened);
    
    this.results.push({
      testName: 'testImageSharpening',
      passed: sharpenedStats.contrast > blurredStats.contrast,
      duration: 0,
      details: {
        blurredContrast: blurredStats.contrast,
        sharpenedContrast: sharpenedStats.contrast
      }
    });
  }

  private async testImageResizing(): Promise<void> {
    const canvas = createTextPatternCanvas(200, 200);
    const resized = await this.preprocessingService.resizeImage(canvas, 100, 100);
    
    this.results.push({
      testName: 'testImageResizing',
      passed: resized.width === 100 && resized.height === 100,
      duration: 0,
      details: { newDimensions: { width: resized.width, height: resized.height } }
    });
  }

  private async testFullPreprocessingPipeline(): Promise<void> {
    const canvas = createTextPatternCanvas(200, 200);
    
    const config: PreprocessingConfig = {
      adaptiveThreshold: { enabled: true, blockSize: 11, C: 2 },
      noiseReduction: { enabled: true, kernelSize: 5 },
      contrastEnhancement: { enabled: true, factor: 1.2 },
      gaussianBlur: { enabled: true, radius: 1 },
      sharpen: { enabled: true, strength: 1.0 },
      resize: { enabled: true, width: 150, height: 150 },
      convertToGrayscale: true
    };

    const preprocessed = await this.preprocessingService.preprocessImage(canvas, config);
    
    this.results.push({
      testName: 'testFullPreprocessingPipeline',
      passed: preprocessed.width === 150 && preprocessed.height === 150,
      duration: 0,
      details: { finalDimensions: { width: preprocessed.width, height: preprocessed.height } }
    });
  }

  private async testPerformanceMetrics(): Promise<void> {
    const canvas = createTextPatternCanvas(500, 500);
    
    const config: PreprocessingConfig = {
      adaptiveThreshold: { enabled: true, blockSize: 11, C: 2 },
      noiseReduction: { enabled: true, kernelSize: 3 },
      convertToGrayscale: true
    };

    const startTime = Date.now();
    await this.preprocessingService.preprocessImage(canvas, config);
    const duration = Date.now() - startTime;

    this.results.push({
      testName: 'testPerformanceMetrics',
      passed: duration < 1000, // Should complete within 1 second for 500x500 image
      duration,
      details: { processingTime: duration }
    });
  }

  private async testConfigurationValidation(): Promise<void> {
    const canvas = createTextPatternCanvas(100, 100);
    
    // Test empty config
    const emptyConfig: PreprocessingConfig = {};
    const result1 = await this.preprocessingService.preprocessImage(canvas, emptyConfig);
    
    // Test all disabled
    const disabledConfig: PreprocessingConfig = {
      adaptiveThreshold: { enabled: false },
      noiseReduction: { enabled: false },
      contrastEnhancement: { enabled: false },
      gaussianBlur: { enabled: false },
      sharpen: { enabled: false },
      resize: { enabled: false },
      convertToGrayscale: false
    };
    const result2 = await this.preprocessingService.preprocessImage(canvas, disabledConfig);

    const originalStats = getImageStats(canvas);
    const result2Stats = getImageStats(result2);
    
    const areSimilar = compareCanvases(canvas, result2, 5);
    
    this.results.push({
      testName: 'testConfigurationValidation',
      passed: areSimilar,
      duration: 0,
      details: { 
        originalDimensions: { width: canvas.width, height: canvas.height },
        resultDimensions: { width: result2.width, height: result2.height },
        areSimilar
      }
    });
  }

  private generateReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.testName}: ${r.error || 'Assertion failed'}`);
      });
    }
    
    console.log('\n📈 Performance Metrics:');
    const perfTests = this.results.filter(r => r.details?.processingTime);
    if (perfTests.length > 0) {
      const avgTime = perfTests.reduce((sum, r) => sum + r.details.processingTime, 0) / perfTests.length;
      console.log(`  Average processing time: ${avgTime.toFixed(1)}ms`);
    }
    
    console.log('\n✨ Test suite completed successfully!');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new PreprocessingTestRunner();
  runner.runAllTests().catch(console.error);
}

export { PreprocessingTestRunner };
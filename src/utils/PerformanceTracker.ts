/**
 * Performance Tracker for OCR Detection Optimization
 * 
 * Captures detailed performance metrics for smart detection analysis
 */

export interface DetectionPerformanceMetrics {
  // Test metadata
  testId: string;
  timestamp: number;
  imageInfo: {
    name: string;
    size: number;
    type: string;
  };
  
  // Detection strategy
  strategy: 'smart' | 'traditional' | 'quick-prescreening' | 'cached';
  smartDetectionEnabled: boolean;
  
  // Timing metrics (milliseconds)
  totalDuration: number;
  phases: {
    prescreening?: number;
    cacheCheck?: number;
    englishOCR?: number;
    qualityAssessment?: number;
    fullDetection?: number;
    textAnalysis?: number;
  };
  
  // Quality metrics
  qualityAssessment?: {
    score: number;
    isGoodQuality: boolean;
    reasons: string[];
    confidence?: number;
  };
  
  // Results
  detectedLanguages: string[];
  fallbackTriggered: boolean;
  errorOccurred: boolean;
  errorMessage?: string;
  
  // Resource metrics
  resourcesLoaded: {
    languageFiles: string[];
    estimatedDownloadSize: number;
  };
  
  // Progress tracking
  progressUpdates: Array<{
    progress: number;
    stage: string;
    timestamp: number;
  }>;
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private currentTest: Partial<DetectionPerformanceMetrics> | null = null;
  private testResults: DetectionPerformanceMetrics[] = [];
  
  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }
  
  startTest(imageFile: File | Blob, strategy: DetectionPerformanceMetrics['strategy'] | 'detecting'): string {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentTest = {
      testId,
      timestamp: Date.now(),
      imageInfo: {
        name: imageFile instanceof File ? imageFile.name : 'blob',
        size: imageFile.size,
        type: imageFile.type
      },
      strategy: strategy as DetectionPerformanceMetrics['strategy'],
      smartDetectionEnabled: true, // Will be updated based on actual config
      phases: {},
      progressUpdates: [],
      resourcesLoaded: {
        languageFiles: [],
        estimatedDownloadSize: 0
      },
      fallbackTriggered: false,
      errorOccurred: false
    };
    
    console.log(`📊 Performance tracking started: ${testId}`);
    return testId;
  }
  
  recordPhaseStart(phase: keyof DetectionPerformanceMetrics['phases']): void {
    if (!this.currentTest) return;
    
    this.currentTest.phases = this.currentTest.phases || {};
    (this.currentTest.phases as any)[`${phase}_start`] = Date.now();
    
    console.log(`⏱️ Phase started: ${phase}`);
  }
  
  recordPhaseEnd(phase: keyof DetectionPerformanceMetrics['phases']): void {
    if (!this.currentTest || !this.currentTest.phases) return;
    
    const startTime = (this.currentTest.phases as any)[`${phase}_start`];
    if (startTime) {
      this.currentTest.phases[phase] = Date.now() - startTime;
      console.log(`⏱️ Phase completed: ${phase} (${this.currentTest.phases[phase]}ms)`);
    }
  }
  
  recordProgress(progress: number, stage: string): void {
    if (!this.currentTest) return;
    
    this.currentTest.progressUpdates!.push({
      progress,
      stage,
      timestamp: Date.now()
    });
  }
  
  recordQualityAssessment(assessment: DetectionPerformanceMetrics['qualityAssessment']): void {
    if (!this.currentTest) return;
    
    this.currentTest.qualityAssessment = assessment;
    console.log(`🔍 Quality assessment recorded:`, assessment);
  }
  
  recordFallback(reason: string): void {
    if (!this.currentTest) return;
    
    this.currentTest.fallbackTriggered = true;
    console.log(`🔄 Fallback triggered: ${reason}`);
  }
  
  recordResourceLoad(languageFiles: string[]): void {
    if (!this.currentTest) return;
    
    // Estimate download sizes based on known language file sizes
    const languageSizes: Record<string, number> = {
      'eng': 4.2,
      'chi_sim': 12.8,
      'chi_tra': 15.2,
      'deu': 5.3,
      'fra': 5.1,
      'jpn': 8.9,
      'spa': 4.8,
      'kor': 6.7,
      'ara': 7.2,
      'rus': 6.1
    };
    
    const estimatedSize = languageFiles.reduce((total, lang) => {
      return total + (languageSizes[lang] || 5.0); // Default 5MB for unknown languages
    }, 0);
    
    this.currentTest.resourcesLoaded = {
      languageFiles: [...languageFiles],
      estimatedDownloadSize: estimatedSize
    };
    
    console.log(`📦 Resources loaded: ${languageFiles.join(', ')} (~${estimatedSize.toFixed(1)}MB)`);
  }
  
  recordError(error: Error): void {
    if (!this.currentTest) return;
    
    this.currentTest.errorOccurred = true;
    this.currentTest.errorMessage = error.message;
    console.log(`❌ Error recorded: ${error.message}`);
  }
  
  finishTest(detectedLanguages: string[]): DetectionPerformanceMetrics | null {
    if (!this.currentTest) return null;
    
    const totalDuration = Date.now() - this.currentTest.timestamp!;
    
    const completedTest: DetectionPerformanceMetrics = {
      ...this.currentTest,
      totalDuration,
      detectedLanguages: [...detectedLanguages]
    } as DetectionPerformanceMetrics;
    
    this.testResults.push(completedTest);
    
    console.log(`✅ Performance test completed: ${completedTest.testId} (${totalDuration}ms)`);
    console.log(`📊 Test summary:`, {
      strategy: completedTest.strategy,
      duration: `${totalDuration}ms`,
      languages: detectedLanguages.join(', '),
      fallback: completedTest.fallbackTriggered,
      resourceSize: `${completedTest.resourcesLoaded.estimatedDownloadSize.toFixed(1)}MB`
    });
    
    this.currentTest = null;
    return completedTest;
  }
  
  getTestResults(): DetectionPerformanceMetrics[] {
    return [...this.testResults];
  }
  
  getLatestTest(): DetectionPerformanceMetrics | null {
    return this.testResults.length > 0 ? this.testResults[this.testResults.length - 1] : null;
  }
  
  compareTests(testIds?: string[]): {
    comparison: Array<{
      testId: string;
      strategy: string;
      duration: number;
      improvement: string;
      resourceEfficiency: string;
    }>;
    summary: {
      averageSmartDetection: number;
      averageTraditional: number;
      averageImprovement: number;
      resourceSavings: number;
    };
  } {
    const testsToCompare = testIds 
      ? this.testResults.filter(t => testIds.includes(t.testId))
      : this.testResults;
    
    if (testsToCompare.length === 0) {
      return { comparison: [], summary: { averageSmartDetection: 0, averageTraditional: 0, averageImprovement: 0, resourceSavings: 0 } };
    }
    
    // Sort by duration for baseline comparison
    testsToCompare.sort((a, b) => a.totalDuration - b.totalDuration);
    const baseline = testsToCompare[0];
    
    const comparison = testsToCompare.map(test => {
      const improvement = baseline.testId === test.testId 
        ? 'baseline'
        : `${Math.round(((test.totalDuration - baseline.totalDuration) / test.totalDuration) * 100)}% slower`;
      
      const resourceEfficiency = baseline.testId === test.testId
        ? 'baseline'
        : `${Math.round(((test.resourcesLoaded.estimatedDownloadSize - baseline.resourcesLoaded.estimatedDownloadSize) / test.resourcesLoaded.estimatedDownloadSize) * 100)}% more resources`;
      
      return {
        testId: test.testId,
        strategy: test.strategy,
        duration: test.totalDuration,
        improvement,
        resourceEfficiency
      };
    });
    
    // Calculate summary statistics
    const smartTests = testsToCompare.filter(t => t.strategy === 'smart');
    const traditionalTests = testsToCompare.filter(t => t.strategy === 'traditional');
    
    const averageSmartDetection = smartTests.length > 0 
      ? smartTests.reduce((sum, t) => sum + t.totalDuration, 0) / smartTests.length 
      : 0;
    
    const averageTraditional = traditionalTests.length > 0
      ? traditionalTests.reduce((sum, t) => sum + t.totalDuration, 0) / traditionalTests.length
      : 0;
    
    const averageImprovement = averageTraditional > 0 && averageSmartDetection > 0
      ? ((averageTraditional - averageSmartDetection) / averageTraditional) * 100
      : 0;
    
    const avgSmartResources = smartTests.length > 0
      ? smartTests.reduce((sum, t) => sum + t.resourcesLoaded.estimatedDownloadSize, 0) / smartTests.length
      : 0;
    
    const avgTraditionalResources = traditionalTests.length > 0
      ? traditionalTests.reduce((sum, t) => sum + t.resourcesLoaded.estimatedDownloadSize, 0) / traditionalTests.length
      : 0;
    
    const resourceSavings = avgTraditionalResources > 0 && avgSmartResources > 0
      ? ((avgTraditionalResources - avgSmartResources) / avgTraditionalResources) * 100
      : 0;
    
    return {
      comparison,
      summary: {
        averageSmartDetection: Math.round(averageSmartDetection),
        averageTraditional: Math.round(averageTraditional),
        averageImprovement: Math.round(averageImprovement),
        resourceSavings: Math.round(resourceSavings)
      }
    };
  }
  
  exportResults(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'testId', 'timestamp', 'strategy', 'totalDuration', 'detectedLanguages',
        'fallbackTriggered', 'errorOccurred', 'estimatedDownloadSize',
        'qualityScore', 'qualityGood', 'progressUpdatesCount'
      ];
      
      const rows = this.testResults.map(test => [
        test.testId,
        new Date(test.timestamp).toISOString(),
        test.strategy,
        test.totalDuration,
        test.detectedLanguages.join(';'),
        test.fallbackTriggered,
        test.errorOccurred,
        test.resourcesLoaded.estimatedDownloadSize,
        test.qualityAssessment?.score || '',
        test.qualityAssessment?.isGoodQuality || '',
        test.progressUpdates.length
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(this.testResults, null, 2);
  }
  
  clearResults(): void {
    this.testResults = [];
    console.log('📊 Performance test results cleared');
  }
}

// Global instance for easy access
export const performanceTracker = PerformanceTracker.getInstance();
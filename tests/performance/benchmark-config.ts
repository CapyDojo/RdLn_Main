/**
 * OCR Performance Benchmark Configuration
 * 
 * Centralized configuration for all OCR performance benchmarks.
 * Allows easy customization of test parameters, thresholds, and reporting.
 */

export interface BenchmarkConfig {
  // Test execution settings
  iterations: number;
  timeout: number;
  warmupRuns: number;
  
  // Performance thresholds
  thresholds: {
    maxDurationMs: number;
    maxMemoryIncreaseMB: number;
    regressionThreshold: number; // multiplier (e.g., 1.2 = 20% regression)
    memoryLeakThresholdMB: number;
  };
  
  // Test data configuration
  testData: {
    documentSampleSize: number;
    imageResolutions: Array<{
      width: number;
      height: number;
      label: string;
    }>;
    languages: string[];
  };
  
  // Reporting settings
  reporting: {
    enableDetailedReports: boolean;
    enableRegressionDetection: boolean;
    saveBaseline: boolean;
    reportFormat: 'json' | 'markdown' | 'html';
    outputPath: string;
  };
  
  // Environment-specific settings
  environment: {
    development: Partial<BenchmarkConfig>;
    staging: Partial<BenchmarkConfig>;
    production: Partial<BenchmarkConfig>;
  };
}

export const defaultConfig: BenchmarkConfig = {
  iterations: 5,
  timeout: 300000, // 5 minutes
  warmupRuns: 2,
  
  thresholds: {
    maxDurationMs: 10000,
    maxMemoryIncreaseMB: 50,
    regressionThreshold: 1.2, // 20% regression
    memoryLeakThresholdMB: 5
  },
  
  testData: {
    documentSampleSize: 3, // Use first 3 documents for speed
    imageResolutions: [
      { width: 800, height: 600, label: 'small' },
      { width: 1200, height: 900, label: 'medium' },
      { width: 1920, height: 1080, label: 'large' }
    ],
    languages: ['eng', 'spa', 'fra', 'deu']
  },
  
  reporting: {
    enableDetailedReports: true,
    enableRegressionDetection: true,
    saveBaseline: true,
    reportFormat: 'markdown',
    outputPath: './benchmark-reports'
  },
  
  environment: {
    development: {
      iterations: 2,
      timeout: 120000,
      testData: {
        documentSampleSize: 2,
        imageResolutions: [
          { width: 800, height: 600, label: 'small' },
          { width: 1200, height: 900, label: 'medium' }
        ]
      }
    },
    staging: {
      iterations: 3,
      timeout: 180000
    },
    production: {
      iterations: 10,
      timeout: 600000,
      thresholds: {
        maxDurationMs: 5000,
        regressionThreshold: 1.1 // Stricter in production
      }
    }
  }
};

export class BenchmarkConfigManager {
  private static instance: BenchmarkConfigManager;
  private config: BenchmarkConfig;
  
  private constructor() {
    this.config = this.loadConfig();
  }
  
  public static getInstance(): BenchmarkConfigManager {
    if (!BenchmarkConfigManager.instance) {
      BenchmarkConfigManager.instance = new BenchmarkConfigManager();
    }
    return BenchmarkConfigManager.instance;
  }
  
  private loadConfig(): BenchmarkConfig {
    const env = this.getEnvironment();
    const envConfig = defaultConfig.environment[env] || {};
    
    return {
      ...defaultConfig,
      ...envConfig,
      environment: defaultConfig.environment // Keep all env configs
    };
  }
  
  private getEnvironment(): 'development' | 'staging' | 'production' {
    if (typeof process !== 'undefined' && process.env.NODE_ENV) {
      return process.env.NODE_ENV as any;
    }
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const envParam = url.searchParams.get('env');
      if (envParam) {
        return envParam as any;
      }
      
      // Detect environment from hostname
      if (window.location.hostname.includes('localhost')) {
        return 'development';
      } else if (window.location.hostname.includes('staging')) {
        return 'staging';
      }
    }
    
    return 'development';
  }
  
  public getConfig(): BenchmarkConfig {
    return this.config;
  }
  
  public updateConfig(updates: Partial<BenchmarkConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  public getThreshold(key: keyof BenchmarkConfig['thresholds']): number {
    return this.config.thresholds[key];
  }
  
  public getTestDataConfig(): BenchmarkConfig['testData'] {
    return this.config.testData;
  }
  
  public getReportingConfig(): BenchmarkConfig['reporting'] {
    return this.config.reporting;
  }
  
  public shouldRunTest(testName: string): boolean {
    // Allow skipping specific tests via environment
    const skipTests = this.getSkipTests();
    return !skipTests.includes(testName);
  }
  
  private getSkipTests(): string[] {
    if (typeof process !== 'undefined' && process.env.SKIP_BENCHMARKS) {
      return process.env.SKIP_BENCHMARKS.split(',').map(s => s.trim());
    }
    return [];
  }
}

// Export convenience functions
export const getBenchmarkConfig = () => BenchmarkConfigManager.getInstance().getConfig();
export const getThreshold = (key: keyof BenchmarkConfig['thresholds']) => 
  BenchmarkConfigManager.getInstance().getThreshold(key);
export const getTestDataConfig = () => 
  BenchmarkConfigManager.getInstance().getTestDataConfig();
export const getReportingConfig = () => 
  BenchmarkConfigManager.getInstance().getReportingConfig();

// Environment detection helpers
export const isCI = () => {
  return (
    (typeof process !== 'undefined' && !!process.env.CI) ||
    (typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('ci') === 'true')
  );
};

export const isDebugMode = () => {
  return (
    (typeof process !== 'undefined' && process.env.DEBUG_BENCHMARKS === 'true') ||
    (typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('debug') === 'true')
  );
};
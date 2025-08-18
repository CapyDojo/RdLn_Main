/**
 * Performance Monitor for Production Use
 * 
 * Lightweight performance monitoring that can be enabled in production
 * to track OCR detection performance and optimization effectiveness
 */

interface PerformanceMetric {
  timestamp: number;
  strategy: 'smart' | 'traditional' | 'cached' | 'quick-prescreening';
  duration: number;
  detectedLanguages: string[];
  fallbackTriggered: boolean;
  resourceSize: number;
  userAgent: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics
  private enabled = false;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  enable(): void {
    this.enabled = true;
    console.log('📊 Performance monitoring enabled');
  }
  
  disable(): void {
    this.enabled = false;
    console.log('📊 Performance monitoring disabled');
  }
  
  recordDetection(
    strategy: PerformanceMetric['strategy'],
    duration: number,
    detectedLanguages: string[],
    fallbackTriggered: boolean = false,
    resourceSize: number = 0
  ): void {
    if (!this.enabled) return;
    
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      strategy,
      duration,
      detectedLanguages: [...detectedLanguages],
      fallbackTriggered,
      resourceSize,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };
    
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log significant performance events
    if (duration > 30000) {
      console.warn(`⚠️ Slow OCR detection: ${duration}ms (${strategy})`);
    } else if (duration < 5000 && strategy === 'smart') {
      console.log(`🚀 Fast smart detection: ${duration}ms`);
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  getAveragePerformance(): {
    smartDetection: { average: number; count: number };
    traditionalDetection: { average: number; count: number };
    improvement: number;
    fallbackRate: number;
  } {
    const smartMetrics = this.metrics.filter(m => m.strategy === 'smart');
    const traditionalMetrics = this.metrics.filter(m => m.strategy === 'traditional');
    
    const smartAverage = smartMetrics.length > 0 
      ? smartMetrics.reduce((sum, m) => sum + m.duration, 0) / smartMetrics.length 
      : 0;
    
    const traditionalAverage = traditionalMetrics.length > 0
      ? traditionalMetrics.reduce((sum, m) => sum + m.duration, 0) / traditionalMetrics.length
      : 0;
    
    const improvement = traditionalAverage > 0 && smartAverage > 0
      ? ((traditionalAverage - smartAverage) / traditionalAverage) * 100
      : 0;
    
    const fallbackCount = smartMetrics.filter(m => m.fallbackTriggered).length;
    const fallbackRate = smartMetrics.length > 0 ? (fallbackCount / smartMetrics.length) * 100 : 0;
    
    return {
      smartDetection: { average: Math.round(smartAverage), count: smartMetrics.length },
      traditionalDetection: { average: Math.round(traditionalAverage), count: traditionalMetrics.length },
      improvement: Math.round(improvement),
      fallbackRate: Math.round(fallbackRate)
    };
  }
  
  exportMetrics(): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      metricsCount: this.metrics.length,
      performance: this.getAveragePerformance(),
      metrics: this.metrics
    }, null, 2);
  }
  
  clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Performance metrics cleared');
  }
}

// Global instance for easy access
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-enable in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  performanceMonitor.enable();
}
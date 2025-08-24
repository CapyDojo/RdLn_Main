import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Test suite for PerformanceMonitor
 * 
 * Comprehensive tests covering performance monitoring functionality including:
 * - Metric recording and aggregation
 * - Timing operations (sync and async)
 * - Alert threshold management
 * - Performance reporting
 * - Configuration management
 * - Resource cleanup
 */

import { PerformanceMonitor } from '../PerformanceMonitor';
import type { 
  PerformanceConfig, 
  MetricCategory, 
  AlertThreshold,
  PerformanceReport 
} from '../../types/performance-types';

// Mock appConfig
vi.mock('../../config/appConfig', () => ({
  appConfig: {
    development: {
      isDevelopment: true
    }
  }
}));

// Mock performance.now
const mockPerformanceNow = vi.fn(() => Date.now());
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Clear any existing instance
    if ((PerformanceMonitor as any).instance) {
      (PerformanceMonitor as any).instance.dispose();
      (PerformanceMonitor as any).instance = null;
    }
    
    // Create fresh instance for each test
    monitor = PerformanceMonitor.getInstance({
      level: 'comprehensive',
      samplingRate: 1.0, // Record all metrics in tests
      bufferSize: 100,
      flushInterval: 1000
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    monitor.dispose();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(monitor);
    });

    it('should create new instance after disposal', () => {
      const instance1 = PerformanceMonitor.getInstance();
      instance1.dispose();
      
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance2).not.toBe(instance1);
      
      // Clean up
      instance2.dispose();
    });
  });

  describe('Metric Recording', () => {
    it('should record basic metrics correctly', () => {
      monitor.recordMetric('test_metric', 100, 'system', { test: true });
      
      const metric = monitor.getCurrentMetric('test_metric', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(100);
      expect(metric!.metadata.test).toBe(true);
      expect(metric!.timestamp).toBeGreaterThan(0);
    });

    it('should handle multiple metrics with same name', () => {
      monitor.recordMetric('test_metric', 100, 'system');
      monitor.recordMetric('test_metric', 150, 'system');
      monitor.recordMetric('test_metric', 200, 'system');
      
      const report = monitor.getPerformanceReport(60000, ['system']);
      const metrics = report.metrics.get('system:test_metric');
      
      expect(metrics).toBeDefined();
      expect(metrics!.count).toBe(3);
      expect(metrics!.average).toBe(150);
      expect(metrics!.min).toBe(100);
      expect(metrics!.max).toBe(200);
    });

    it('should respect buffer size limits', () => {
      // Clear existing instance first
      if ((PerformanceMonitor as any).instance) {
        (PerformanceMonitor as any).instance.dispose();
        (PerformanceMonitor as any).instance = null;
      }
      
      const smallBufferMonitor = PerformanceMonitor.getInstance({
        bufferSize: 2
      });
      
      smallBufferMonitor.recordMetric('test', 1, 'system');
      smallBufferMonitor.recordMetric('test', 2, 'system');
      smallBufferMonitor.recordMetric('test', 3, 'system'); // Should evict first metric
      
      const report = smallBufferMonitor.getPerformanceReport(60000, ['system']);
      const metrics = report.metrics.get('system:test');
      
      expect(metrics).toBeDefined();
      expect(metrics!.count).toBe(2);
      expect(metrics!.min).toBe(2); // First metric should be evicted
      expect(metrics!.max).toBe(3);
      
      smallBufferMonitor.dispose();
    });

    it('should handle different metric categories', () => {
      monitor.recordMetric('metric1', 100, 'system');
      monitor.recordMetric('metric2', 200, 'ocr');
      monitor.recordMetric('metric3', 300, 'ui');
      monitor.recordMetric('metric4', 400, 'business');
      
      const report = monitor.getPerformanceReport();
      
      expect(report.metrics.size).toBe(4);
      expect(report.metrics.has('system:metric1')).toBe(true);
      expect(report.metrics.has('ocr:metric2')).toBe(true);
      expect(report.metrics.has('ui:metric3')).toBe(true);
      expect(report.metrics.has('business:metric4')).toBe(true);
    });
  });

  describe('Timing Operations', () => {
    beforeEach(() => {
      let timeValue = 1000;
      mockPerformanceNow.mockImplementation(() => {
        const current = timeValue;
        timeValue += 50; // Each call advances by 50ms
        return current;
      });
    });

    it('should time synchronous operations', () => {
      const result = monitor.time('sync_operation', 'system', () => {
        return 'test_result';
      });
      
      expect(result).toBe('test_result');
      
      const metric = monitor.getCurrentMetric('sync_operation', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(50); // Should be 50ms based on mock
      expect(metric!.metadata.status).toBe('success');
    });

    it('should time asynchronous operations', async () => {
      const result = await monitor.time('async_operation', 'system', async () => {
        return Promise.resolve('async_result');
      });
      
      expect(result).toBe('async_result');
      
      const metric = monitor.getCurrentMetric('async_operation', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(50);
      expect(metric!.metadata.status).toBe('success');
    });

    it('should handle synchronous operation errors', () => {
      expect(() => {
        monitor.time('error_operation', 'system', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
      
      const metric = monitor.getCurrentMetric('error_operation', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(50);
      expect(metric!.metadata.status).toBe('error');
      expect(metric!.metadata.error).toBe('Test error');
    });

    it('should handle asynchronous operation errors', async () => {
      await expect(monitor.time('async_error', 'system', async () => {
        throw new Error('Async error');
      })).rejects.toThrow('Async error');
      
      const metric = monitor.getCurrentMetric('async_error', 'system');
      expect(metric).toBeDefined();
      expect(metric!.metadata.status).toBe('error');
      expect(metric!.metadata.error).toBe('Async error');
    });

    it('should support start/stop timing pattern', () => {
      const stopTiming = monitor.startTiming('manual_timing', 'system');
      
      // Simulate some time passing
      stopTiming({ custom: 'metadata' });
      
      const metric = monitor.getCurrentMetric('manual_timing', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(50);
      expect(metric!.metadata.custom).toBe('metadata');
    });
  });

  describe('Alert Thresholds', () => {
    it('should trigger alerts when thresholds are exceeded', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.setAlertThreshold('test_metric', 'system', {
        maxValue: 100,
        severity: 'warning'
      });
      
      monitor.recordMetric('test_metric', 150, 'system'); // Exceeds threshold
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert'),
        expect.stringContaining('test_metric exceeded threshold'),
        expect.any(Object)
      );
      
      // Check alert was recorded as metric
      const alertMetric = monitor.getCurrentMetric('alert_triggered', 'system');
      expect(alertMetric).toBeDefined();
      expect(alertMetric!.value).toBe(1);
      
      consoleSpy.mockRestore();
    });

    it('should trigger alerts for minimum thresholds', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.setAlertThreshold('test_metric', 'system', {
        minValue: 100,
        severity: 'error'
      });
      
      monitor.recordMetric('test_metric', 50, 'system'); // Below threshold
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert'),
        expect.stringContaining('test_metric below threshold'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('should call custom alert callbacks', () => {
      const mockCallback = vi.fn();
      
      monitor.setAlertThreshold('test_metric', 'system', {
        maxValue: 100,
        severity: 'warning',
        callback: mockCallback
      });
      
      monitor.recordMetric('test_metric', 150, 'system');
      
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_metric',
          value: 150,
          category: 'system'
        }),
        expect.stringContaining('test_metric exceeded threshold')
      );
    });
  });

  describe('Performance Reporting', () => {
    beforeEach(() => {
      // Set up test data
      const baseTime = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(baseTime)
        .mockReturnValueOnce(baseTime + 1000)
        .mockReturnValueOnce(baseTime + 2000)
        .mockReturnValueOnce(baseTime + 3000)
        .mockReturnValue(baseTime + 5000);
      
      monitor.recordMetric('metric1', 100, 'system');
      monitor.recordMetric('metric1', 200, 'system');
      monitor.recordMetric('metric2', 300, 'ocr');
      monitor.recordMetric('error_metric', 50, 'system', { status: 'error' });
    });

    it('should generate comprehensive performance reports', () => {
      const report = monitor.getPerformanceReport(10000); // 10 second window
      
      expect(report.timeRange).toBe(10000);
      expect(report.categories).toEqual(['system', 'ocr', 'ui', 'business']);
      expect(report.metrics.size).toBe(3); // metric1, metric2, error_metric
      expect(report.summary.totalMetrics).toBe(4);
      expect(report.generatedAt).toBeGreaterThan(0);
    });

    it('should filter reports by category', () => {
      const report = monitor.getPerformanceReport(10000, ['system']);
      
      expect(report.metrics.size).toBe(2); // metric1 and error_metric
      expect(report.metrics.has('system:metric1')).toBe(true);
      expect(report.metrics.has('system:error_metric')).toBe(true);
      expect(report.metrics.has('ocr:metric2')).toBe(false);
    });

    it('should calculate correct statistics', () => {
      const report = monitor.getPerformanceReport(10000, ['system']);
      const metric1Stats = report.metrics.get('system:metric1');
      
      expect(metric1Stats).toBeDefined();
      expect(metric1Stats!.count).toBe(2);
      expect(metric1Stats!.average).toBe(150);
      expect(metric1Stats!.min).toBe(100);
      expect(metric1Stats!.max).toBe(200);
    });

    it('should calculate error rates correctly', () => {
      const report = monitor.getPerformanceReport(10000);
      
      expect(report.summary.errorRate).toBe(25); // 1 error out of 4 metrics = 25%
    });

    it('should filter metrics by time range', () => {
      const report = monitor.getPerformanceReport(1000); // Very short window
      
      // All metrics should be filtered out due to time range
      expect(report.metrics.size).toBe(0);
      expect(report.summary.totalMetrics).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should use default configuration when none provided', () => {
      // Clear existing instance and create fresh one
      if ((PerformanceMonitor as any).instance) {
        (PerformanceMonitor as any).instance.dispose();
        (PerformanceMonitor as any).instance = null;
      }
      
      const defaultMonitor = PerformanceMonitor.getInstance();
      const config = (defaultMonitor as any).config;
      
      expect(config.level).toBe('comprehensive'); // Development mode
      expect(config.samplingRate).toBe(1.0); // Development mode
      expect(config.bufferSize).toBe(1000);
      expect(config.anonymizeData).toBe(false); // Development mode
      
      defaultMonitor.dispose();
    });

    it('should accept custom configuration', () => {
      // Clear existing instance first
      if ((PerformanceMonitor as any).instance) {
        (PerformanceMonitor as any).instance.dispose();
        (PerformanceMonitor as any).instance = null;
      }
      
      const customConfig: Partial<PerformanceConfig> = {
        level: 'minimal',
        samplingRate: 0.5,
        bufferSize: 500
      };
      
      const customMonitor = PerformanceMonitor.getInstance(customConfig);
      
      const config = (customMonitor as any).config;
      expect(config.level).toBe('minimal');
      expect(config.samplingRate).toBe(0.5);
      expect(config.bufferSize).toBe(500);
      
      customMonitor.dispose();
    });

    it('should update configuration dynamically', () => {
      monitor.updateConfig({
        samplingRate: 0.1,
        bufferSize: 50
      });
      
      const config = (monitor as any).config;
      expect(config.samplingRate).toBe(0.1);
      expect(config.bufferSize).toBe(50);
    });

    it('should respect sampling rate', () => {
      monitor.updateConfig({ samplingRate: 0 }); // No sampling
      
      monitor.recordMetric('sampled_metric', 100, 'system');
      
      const metric = monitor.getCurrentMetric('sampled_metric', 'system');
      expect(metric).toBeNull(); // Should not be recorded due to sampling
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should disable metric recording when disabled', () => {
      monitor.setEnabled(false);
      monitor.recordMetric('disabled_metric', 100, 'system');
      
      const metric = monitor.getCurrentMetric('disabled_metric', 'system');
      expect(metric).toBeNull();
    });

    it('should re-enable metric recording when enabled', () => {
      monitor.setEnabled(false);
      monitor.setEnabled(true);
      
      monitor.recordMetric('enabled_metric', 100, 'system');
      
      const metric = monitor.getCurrentMetric('enabled_metric', 'system');
      expect(metric).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should clear all metrics when requested', () => {
      monitor.recordMetric('metric1', 100, 'system');
      monitor.recordMetric('metric2', 200, 'ocr');
      
      monitor.clearMetrics();
      
      expect(monitor.getCurrentMetric('metric1', 'system')).toBeNull();
      expect(monitor.getCurrentMetric('metric2', 'ocr')).toBeNull();
      
      const report = monitor.getPerformanceReport();
      expect(report.metrics.size).toBe(0);
    });

    it('should clean up resources on disposal', () => {
      const disposalMonitor = PerformanceMonitor.getInstance();
      
      disposalMonitor.recordMetric('test', 100, 'system');
      disposalMonitor.setAlertThreshold('test', 'system', { maxValue: 50, severity: 'warning' });
      
      disposalMonitor.dispose();
      
      // Instance should be reset
      expect((PerformanceMonitor as any).instance).toBeNull();
    });
  });

  describe('Convenience Functions', () => {
    it('should provide working convenience functions', async () => {
      // Use dynamic import to avoid require issues
      const PerformanceMonitorModule = await import('../PerformanceMonitor');
      
      PerformanceMonitorModule.recordMetric('convenience_metric', 100, 'system', { test: true });
      
      const metric = PerformanceMonitorModule.performanceMonitor.getCurrentMetric('convenience_metric', 'system');
      expect(metric).toBeDefined();
      expect(metric!.value).toBe(100);
    });

    it('should provide working timing convenience functions', async () => {
      // Use dynamic import to avoid require issues
      const PerformanceMonitorModule = await import('../PerformanceMonitor');
      
      const result = PerformanceMonitorModule.timeFunction('convenience_timing', 'system', () => 'result');
      
      expect(result).toBe('result');
      
      const metric = PerformanceMonitorModule.performanceMonitor.getCurrentMetric('convenience_timing', 'system');
      expect(metric).toBeDefined();
    });

    it('should provide working start timing convenience function', async () => {
      // Use dynamic import to avoid require issues
      const PerformanceMonitorModule = await import('../PerformanceMonitor');
      
      const stopTiming = PerformanceMonitorModule.startTiming('convenience_start', 'system');
      stopTiming({ custom: true });
      
      const metric = PerformanceMonitorModule.performanceMonitor.getCurrentMetric('convenience_start', 'system');
      expect(metric).toBeDefined();
      expect(metric!.metadata.custom).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should not crash when recording metrics fails', () => {
      // Mock console.warn to verify error handling
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Trigger an error by corrupting internal state
      (monitor as any).metrics = null;
      
      expect(() => {
        monitor.recordMetric('error_metric', 100, 'system');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'PerformanceMonitor: Failed to record metric',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle alert callback errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      monitor.setAlertThreshold('error_callback', 'system', {
        maxValue: 50,
        severity: 'warning',
        callback: () => {
          throw new Error('Callback error');
        }
      });
      
      expect(() => {
        monitor.recordMetric('error_callback', 100, 'system');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'PerformanceMonitor: Failed to trigger alert',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});

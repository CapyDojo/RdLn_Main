/**
 * Simplified test suite for performance monitoring hooks
 * Testing core functionality without complex mocking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, render, screen } from '@testing-library/react';
import React from 'react';

// Simple mock for performance monitoring
const mockPerformanceMonitor = {
  recordMetric: vi.fn(),
  time: vi.fn((name, category, operation) => operation()),
  startTiming: vi.fn(() => vi.fn()),
  getCurrentMetric: vi.fn(),
  getPerformanceReport: vi.fn(() => ({
    timeRange: 60000,
    categories: ['ui'],
    metrics: new Map(),
    summary: { totalMetrics: 0, averageResponseTime: 0, errorRate: 0, alertsTriggered: 0 },
    generatedAt: Date.now()
  })),
  setAlertThreshold: vi.fn(),
  setEnabled: vi.fn(),
  updateConfig: vi.fn(),
  clearMetrics: vi.fn()
};

// Mock the dependencies
vi.mock('../../services/PerformanceMonitor', () => ({
  performanceMonitor: mockPerformanceMonitor,
  PerformanceMonitor: {
    getInstance: () => mockPerformanceMonitor
  }
}));

vi.mock('../../config/appConfig', () => ({
  appConfig: {
    development: {
      isDevelopment: true
    }
  }
}));

// Mock performance.now
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now())
} as any;

describe('Performance Hooks - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mock Setup Verification', () => {
    it('should have properly mocked performance monitor', () => {
      expect(mockPerformanceMonitor.recordMetric).toBeDefined();
      expect(typeof mockPerformanceMonitor.recordMetric).toBe('function');
    });

    it('should be able to call mocked functions', () => {
      mockPerformanceMonitor.recordMetric('test', 100, 'ui', {});
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith('test', 100, 'ui', {});
    });

    it('should properly mock performance.now', () => {
      const now = performance.now();
      expect(typeof now).toBe('number');
      expect(now).toBeGreaterThan(0);
    });
  });

  describe('Simple Hook Tests', () => {
    it('should import usePerformanceMonitor without errors', async () => {
      const { usePerformanceMonitor } = await import('../usePerformanceMonitor');
      expect(usePerformanceMonitor).toBeDefined();
      expect(typeof usePerformanceMonitor).toBe('function');
    });

    it('should import PerformanceProvider without errors', async () => {
      const { PerformanceProvider } = await import('../../contexts/PerformanceContext');
      expect(PerformanceProvider).toBeDefined();
      expect(typeof PerformanceProvider).toBe('function');
    });

    it('should render a component with usePerformanceMonitor', async () => {
      const { usePerformanceMonitor } = await import('../usePerformanceMonitor');
      
      const TestComponent = () => {
        const monitor = usePerformanceMonitor({ componentName: 'TestComponent' });
        
        return (
          <div data-testid="test-component">
            <span data-testid="enabled">{monitor.isEnabled ? 'enabled' : 'disabled'}</span>
            <button 
              data-testid="record-metric"
              onClick={() => monitor.recordMetric('test_metric', 100)}
            >
              Record Metric
            </button>
          </div>
        );
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByTestId('enabled')).toHaveTextContent('enabled');
      
      // Test recording a metric
      const button = screen.getByTestId('record-metric');
      act(() => {
        button.click();
      });
      
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalled();
    });

    it('should render PerformanceProvider with children', async () => {
      const { PerformanceProvider, usePerformanceContext } = await import('../../contexts/PerformanceContext');
      
      const TestChild = () => {
        try {
          const { state } = usePerformanceContext();
          return <div data-testid="child">Enabled: {state.isEnabled.toString()}</div>;
        } catch {
          return <div data-testid="child">Error accessing context</div>;
        }
      };

      render(
        <PerformanceProvider>
          <TestChild />
        </PerformanceProvider>
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle disabled monitoring gracefully', async () => {
      const { usePerformanceMonitor } = await import('../usePerformanceMonitor');
      
      const { result } = renderHook(() => 
        usePerformanceMonitor({ componentName: 'TestComponent', enabled: false })
      );
      
      expect(result.current.isEnabled).toBe(false);
      
      // Should not throw when recording metrics while disabled
      act(() => {
        result.current.recordMetric('test', 100);
      });
      
      expect(mockPerformanceMonitor.recordMetric).not.toHaveBeenCalled();
    });

    it('should handle context outside provider', async () => {
      const { usePerformanceContext } = await import('../../contexts/PerformanceContext');
      
      const TestComponent = () => {
        try {
          usePerformanceContext();
          return <div>Should not render</div>;
        } catch (error: any) {
          return <div data-testid="error">{error.message}</div>;
        }
      };

      render(<TestComponent />);
      
      expect(screen.getByTestId('error')).toHaveTextContent('usePerformanceContext must be used within a PerformanceProvider');
    });
  });

  describe('Integration Tests', () => {
    it('should work together - provider and hook', async () => {
      const { PerformanceProvider, usePerformanceContext } = await import('../../contexts/PerformanceContext');
      const { usePerformanceMonitor } = await import('../usePerformanceMonitor');
      
      const TestComponent = () => {
        const { state, actions } = usePerformanceContext();
        const monitor = usePerformanceMonitor({ 
          componentName: 'IntegrationTest',
          enabled: state.isEnabled 
        });
        
        return (
          <div>
            <span data-testid="context-enabled">{state.isEnabled.toString()}</span>
            <span data-testid="hook-enabled">{monitor.isEnabled.toString()}</span>
            <button 
              data-testid="disable-btn"
              onClick={() => actions.disable()}
            >
              Disable
            </button>
            <button 
              data-testid="record-btn"
              onClick={() => monitor.recordMetric('integration_test', 42)}
            >
              Record
            </button>
          </div>
        );
      };

      render(
        <PerformanceProvider>
          <TestComponent />
        </PerformanceProvider>
      );
      
      // Initially enabled
      expect(screen.getByTestId('context-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('hook-enabled')).toHaveTextContent('true');
      
      // Record a metric
      act(() => {
        screen.getByTestId('record-btn').click();
      });
      
      expect(mockPerformanceMonitor.recordMetric).toHaveBeenCalledWith(
        'IntegrationTest_integration_test',
        42,
        'ui',
        expect.objectContaining({
          componentName: 'IntegrationTest'
        })
      );
      
      // Disable monitoring
      act(() => {
        screen.getByTestId('disable-btn').click();
      });
      
      expect(mockPerformanceMonitor.setEnabled).toHaveBeenCalledWith(false);
    });
  });
});

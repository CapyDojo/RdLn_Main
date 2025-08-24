/**
 * Consolidated Testing Infrastructure
 * 
 * SSMR: Provides unified testing patterns, utilities, and configurations
 * for consistent test structure across the codebase.
 */

import { BaseHookReturn } from '../types/components';
import { ErrorId, PerformanceTimestamp } from '../types/enhancedTypes';

export interface TestConfig {
  /** Timeout for async operations in tests */
  asyncTimeout: number;
  /** Whether to run performance tracking in tests */
  enablePerformanceTracking: boolean;
  /** Whether to enable verbose logging in tests */
  enableVerboseLogging: boolean;
  /** Maximum acceptable operation time in ms */
  maxOperationTime: number;
}

export const DEFAULT_TEST_CONFIG: TestConfig = {
  asyncTimeout: 5000,
  enablePerformanceTracking: true,
  enableVerboseLogging: false,
  maxOperationTime: 100
};

/**
 * Helper to validate BaseHookReturn structure
 */
export function validateBaseHookReturn<TState, TActions>(
  hookResult: BaseHookReturn<TState, TActions>
): void {
  expect(hookResult).toHaveProperty('state');
  expect(hookResult).toHaveProperty('actions');
  expect(hookResult).toHaveProperty('status');
  
  expect(hookResult.status).toHaveProperty('isInitialized');
  expect(hookResult.status).toHaveProperty('isLoading');
  expect(hookResult.status).toHaveProperty('lastUpdated');
  
  expect(typeof hookResult.status.isInitialized).toBe('boolean');
  expect(typeof hookResult.status.isLoading).toBe('boolean');
  expect(typeof hookResult.status.lastUpdated).toBe('number');
}

/**
 * Helper to validate performance metadata
 */
export function validatePerformanceMetadata(
  performance?: BaseHookReturn<any, any>['performance']
): void {
  if (performance) {
    expect(performance).toHaveProperty('initializationTime');
    expect(performance).toHaveProperty('lastOperationTime');
    expect(performance).toHaveProperty('totalOperations');
    
    expect(typeof performance.initializationTime).toBe('number');
    expect(typeof performance.lastOperationTime).toBe('number');
    expect(typeof performance.totalOperations).toBe('number');
    
    expect(performance.initializationTime).toBeGreaterThanOrEqual(0);
    expect(performance.totalOperations).toBeGreaterThanOrEqual(0);
  }
}

/**
 * Helper to create mock error for testing
 */
export function createMockError(
  message: string = 'Test error',
  canRetry: boolean = true
): NonNullable<BaseHookReturn<any, any>['status']['error']> {
  return {
    id: `test-error-${Date.now()}` as ErrorId,
    message,
    timestamp: Date.now() as PerformanceTimestamp,
    canRetry
  };
}

/**
 * Helper to wait for async operations in tests
 */
export function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock performance timing for consistent test results
 */
export function mockPerformanceTiming(): {
  mockNow: () => number;
  resetTiming: () => void;
} {
  let mockTime = 1000; // Start at 1 second
  
  const originalNow = Date.now;
  
  const mockNow = vi.fn(() => mockTime);
  Date.now = mockNow;
  
  return {
    mockNow: () => {
      mockTime += 10; // Increment by 10ms for each call
      return mockTime;
    },
    resetTiming: () => {
      Date.now = originalNow;
      mockTime = 1000;
    }
  };
}

/**
 * Test suite for component validation
 */
export interface ComponentTestSuite<TProps = any> {
  /** Component display name for debugging */
  displayName: string;
  /** Required props for basic rendering */
  requiredProps: TProps;
  /** Optional props for extended testing */
  optionalProps?: Partial<TProps>;
  /** Custom validation functions */
  customValidations?: Array<(component: any) => void>;
}

/**
 * Test suite for hook validation
 */
export interface HookTestSuite<TReturn = any, TConfig = any> {
  /** Hook name for debugging */
  hookName: string;
  /** Default configuration */
  defaultConfig?: TConfig;
  /** Alternative configurations for testing */
  testConfigs?: TConfig[];
  /** Expected return structure validation */
  validateReturn: (result: TReturn) => void;
  /** Custom test scenarios */
  scenarios?: Array<{
    name: string;
    config?: TConfig;
    test: (result: TReturn) => void | Promise<void>;
  }>;
}

/**
 * Create standardized test case for BaseHookReturn compliance
 */
export function createBaseHookReturnTest<TState, TActions>(
  hookName: string,
  useHook: () => BaseHookReturn<TState, TActions>
) {
  return {
    [`${hookName} should follow BaseHookReturn pattern`]: () => {
      const result = useHook();
      validateBaseHookReturn(result);
      validatePerformanceMetadata(result.performance);
    }
  };
}

/**
 * Performance test helpers
 */
export class PerformanceTestUtils {
  private startTime: number = 0;
  private measurements: number[] = [];
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    return duration;
  }
  
  getAverage(): number {
    return this.measurements.length > 0 
      ? this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length 
      : 0;
  }
  
  getMax(): number {
    return Math.max(...this.measurements);
  }
  
  reset(): void {
    this.measurements = [];
    this.startTime = 0;
  }
  
  assertPerformance(maxTime: number, message?: string): void {
    const avg = this.getAverage();
    expect(avg).toBeLessThanOrEqual(maxTime, 
      message || `Average execution time ${avg}ms exceeds limit ${maxTime}ms`);
  }
}

/**
 * Error boundary test helper
 */
export function createErrorBoundaryTest(
  component: React.ComponentType,
  triggerError: () => void
) {
  return {
    'should handle errors gracefully with error boundary': () => {
      // Implementation would depend on specific testing framework
      // This is a placeholder for error boundary testing pattern
      expect(() => triggerError()).not.toThrow();
    }
  };
}

/**
 * Accessibility test helpers
 */
export const A11yTestUtils = {
  validateAriaLabels: (element: HTMLElement) => {
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, [role="button"]');
    interactiveElements.forEach(el => {
      const hasLabel = el.getAttribute('aria-label') || 
                      el.getAttribute('aria-labelledby') ||
                      (el as HTMLElement).textContent?.trim();
      expect(hasLabel).toBeTruthy(`Element ${el.tagName} missing accessible label`);
    });
  },
  
  validateKeyboardNavigation: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
    focusableElements.forEach(el => {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    });
  }
};

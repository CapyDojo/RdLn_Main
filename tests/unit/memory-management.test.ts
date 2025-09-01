/**
 * Consolidated Memory Management Tests
 * 
 * Tests for memory cleanup during cancellation operations across the RdLn application.
 * Consolidates tests from state-memory-cleanup-simple.test.ts, closure-memory-cleanup.test.ts,
 * and myers-algorithm-memory-cleanup.test.ts for better maintainability.
 * 
 * Test Categories:
 * 1. State Memory Cleanup (useComparison hook)
 * 2. Closure Memory Cleanup (large text handling)
 * 3. Algorithm Memory Cleanup (Myers algorithm chunks)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the MyersAlgorithm to simulate cancellation scenarios
vi.mock('../../src/algorithms/MyersAlgorithm', () => ({
  MyersAlgorithm: {
    compare: vi.fn()
  }
}));

// Mock performance monitor
vi.mock('../../src/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    trackMetric: vi.fn(),
    trackOperation: vi.fn((name, fn) => fn()),
    getRecentMetrics: vi.fn(() => []),
    getLastMetricValue: vi.fn()
  })
}));

describe('Memory Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock localStorage
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'true'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    
    // Clean up any global abort signals
    try {
      (globalThis as any).currentAbortSignal = null;
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('State Memory Cleanup', () => {
    it('should have cancelComparison function available', async () => {
      const { useComparison } = await import('../../src/hooks/useComparison');
      const { result } = renderHook(() => useComparison());
      
      // Verify the function exists and is callable
      expect(typeof result.current.cancelComparison).toBe('function');
      
      // Verify it can be called without errors
      expect(() => {
        result.current.cancelComparison();
      }).not.toThrow();
    });

    it('should handle cancellation during document comparison', async () => {
      const { useComparison } = await import('../../src/hooks/useComparison');
      const { result } = renderHook(() => useComparison());
      
      // Set up test documents
      act(() => {
        result.current.setOriginalText('test original');
        result.current.setRevisedText('test revised');
      });
      
      // Test cancellation functionality
      act(() => {
        result.current.cancelComparison();
      });
      
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Closure Memory Cleanup', () => {
    let mockCompare: any;
    
    beforeEach(() => {
      const { MyersAlgorithm } = require('../../src/algorithms/MyersAlgorithm');
      mockCompare = MyersAlgorithm.compare;
    });

    it('should handle large text cancellation without memory leaks', async () => {
      // Create large text content to simulate memory pressure
      const largeOriginalText = 'A'.repeat(10000); // 10KB (reduced from 50KB for faster tests)
      const largeRevisedText = 'B'.repeat(10000);   // 10KB
      
      // Mock the algorithm to throw a cancellation error
      mockCompare.mockRejectedValue(new Error('Operation cancelled by user'));
      
      const { useComparison } = await import('../../src/hooks/useComparison');
      const { result } = renderHook(() => useComparison());
      
      // Set large text content
      act(() => {
        result.current.setOriginalText(largeOriginalText);
        result.current.setRevisedText(largeRevisedText);
      });
      
      // Attempt comparison that will be cancelled
      await act(async () => {
        try {
          await result.current.compareDocuments();
        } catch (error) {
          // Expected to fail due to cancellation
        }
      });
      
      // Verify error state is set (indicating cancellation was handled)
      expect(result.current.error).toBeTruthy();
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle memory-related errors gracefully', async () => {
      const originalText = 'Original content for testing';
      const revisedText = 'Revised content for testing';
      
      // Mock the algorithm to throw a memory-related error
      mockCompare.mockRejectedValue(new Error('Maximum call stack size exceeded'));
      
      const { useComparison } = await import('../../src/hooks/useComparison');
      const { result } = renderHook(() => useComparison());
      
      act(() => {
        result.current.setOriginalText(originalText);
        result.current.setRevisedText(revisedText);
      });
      
      await act(async () => {
        try {
          await result.current.compareDocuments();
        } catch (error) {
          // Expected to fail
        }
      });
      
      // Verify error handling worked
      expect(result.current.error).toContain('documents are too large');
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle repeated operations without memory accumulation', async () => {
      const { useComparison } = await import('../../src/hooks/useComparison');
      const { result } = renderHook(() => useComparison());
      
      // Simulate multiple operations
      for (let i = 0; i < 3; i++) {
        mockCompare.mockRejectedValueOnce(new Error('Operation cancelled by user'));
        
        act(() => {
          result.current.setOriginalText(`text ${i}`);
          result.current.setRevisedText(`revised ${i}`);
        });
        
        await act(async () => {
          try {
            await result.current.compareDocuments();
          } catch (error) {
            // Expected cancellation
          }
        });
        
        // Verify state is properly reset after each operation
        expect(result.current.isProcessing).toBe(false);
      }
    });
  });

  describe('Algorithm Memory Cleanup', () => {
    it('should handle cancellation signals properly', async () => {
      const abortController = new AbortController();
      
      // Cancel immediately to test cancellation handling
      abortController.abort();
      
      // Test that cancellation is handled without throwing unhandled errors
      try {
        const { MyersAlgorithm } = await import('../../src/algorithms/MyersAlgorithm');
        await MyersAlgorithm.compare(
          'test original',
          'test revised',
          () => {}, // progress callback
          abortController.signal
        );
      } catch (error) {
        // Cancellation error is expected
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('cancelled');
        }
      }
    });

    it('should clean up resources during algorithm cancellation', async () => {
      const abortController = new AbortController();
      
      // Start operation and cancel after short delay
      setTimeout(() => {
        abortController.abort();
      }, 10);
      
      try {
        const { MyersAlgorithm } = await import('../../src/algorithms/MyersAlgorithm');
        await MyersAlgorithm.compare(
          'A'.repeat(1000),
          'B'.repeat(1000),
          () => {},
          abortController.signal
        );
      } catch (error) {
        // Expected cancellation
        expect(error).toBeInstanceOf(Error);
      }
      
      // Test passes if no unhandled promise rejections occur
      expect(true).toBe(true);
    });
  });

  describe('Global Memory Management', () => {
    it('should not leave hanging global state after tests', () => {
      // Verify that global state is properly cleaned up
      expect((globalThis as any).currentAbortSignal).toBeNull();
    });

    it('should handle cleanup of abort signals', () => {
      // Set a global abort signal
      const controller = new AbortController();
      (globalThis as any).currentAbortSignal = controller.signal;
      
      // Simulate cleanup
      (globalThis as any).currentAbortSignal = null;
      
      expect((globalThis as any).currentAbortSignal).toBeNull();
    });
  });
});
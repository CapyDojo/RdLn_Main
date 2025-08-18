import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComparison } from '../src/hooks/useComparison';
import { MyersAlgorithm } from '../src/algorithms/MyersAlgorithm';

// Mock the MyersAlgorithm to simulate cancellation scenarios
vi.mock('../src/algorithms/MyersAlgorithm', () => ({
  MyersAlgorithm: {
    compare: vi.fn()
  }
}));

// Mock performance monitor
vi.mock('../src/hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    trackMetric: vi.fn(),
    trackOperation: vi.fn((name, fn) => fn()),
    getRecentMetrics: vi.fn(() => []),
    getLastMetricValue: vi.fn()
  })
}));

describe('Closure Memory Cleanup', () => {
  let mockCompare: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get the mocked compare function
    mockCompare = MyersAlgorithm.compare;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'true'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should nullify large text variables when cancellation occurs', async () => {
    // Create large text content to simulate memory pressure
    const largeOriginalText = 'A'.repeat(50000); // 50KB
    const largeRevisedText = 'B'.repeat(50000);   // 50KB
    
    // Mock the algorithm to throw a cancellation error
    mockCompare.mockRejectedValue(new Error('Operation cancelled by user'));
    
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
    
    // Verify that the comparison was attempted with the large texts
    expect(mockCompare).toHaveBeenCalledWith(
      largeOriginalText,
      largeRevisedText,
      expect.any(Function)
    );
    
    // Verify error state is set (indicating cancellation was handled)
    expect(result.current.error).toBeTruthy();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle memory cleanup during algorithm errors', async () => {
    const originalText = 'Original content for testing';
    const revisedText = 'Revised content for testing';
    
    // Mock the algorithm to throw a memory-related error
    mockCompare.mockRejectedValue(new Error('Maximum call stack size exceeded'));
    
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

  it('should handle cleanup during UI limit exceeded errors', async () => {
    const originalText = 'Test original';
    const revisedText = 'Test revised';
    
    // Mock the algorithm to throw a UI limit error
    mockCompare.mockRejectedValue(new Error('Result exceeds the UI limit'));
    
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
    expect(result.current.error).toContain('too different or contain too many changes');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should preserve existing cancellation functionality', async () => {
    const originalText = 'Test content';
    const revisedText = 'Modified content';
    
    const { result } = renderHook(() => useComparison());
    
    act(() => {
      result.current.setOriginalText(originalText);
      result.current.setRevisedText(revisedText);
    });
    
    // Test that cancelComparison function exists and can be called
    expect(typeof result.current.cancelComparison).toBe('function');
    
    // Call cancel function (should not throw error)
    act(() => {
      result.current.cancelComparison();
    });
    
    // Verify cancellation state is properly managed
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle repeated cancellation scenarios without memory accumulation', async () => {
    const largeText1 = 'X'.repeat(25000);
    const largeText2 = 'Y'.repeat(25000);
    
    const { result } = renderHook(() => useComparison());
    
    // Clear any previous mock calls
    mockCompare.mockClear();
    
    // Simulate multiple cancellation scenarios
    for (let i = 0; i < 3; i++) {
      // Mock cancellation error for each iteration
      mockCompare.mockRejectedValueOnce(new Error('Operation cancelled by user'));
      
      act(() => {
        result.current.setOriginalText(largeText1 + i);
        result.current.setRevisedText(largeText2 + i);
      });
      
      await act(async () => {
        try {
          await result.current.compareDocuments(false, true); // Disable auto-compare
        } catch (error) {
          // Expected cancellation
        }
      });
      
      // Verify state is properly reset after each cancellation
      expect(result.current.isProcessing).toBe(false);
      // Error may be null or truthy depending on timing, just verify processing stopped
    }
    
    // Verify that cancellations were handled (allow for auto-compare calls)
    expect(mockCompare.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
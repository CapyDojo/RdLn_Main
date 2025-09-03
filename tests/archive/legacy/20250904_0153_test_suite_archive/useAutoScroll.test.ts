/**
 * Tests for useAutoScroll hook
 */

import { renderHook } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the config module
const mockFeatureFlags = {
  AUTO_SCROLL_ENABLED: true // Test with enabled by default, individual tests can override
};

vi.mock('../../config/appConfig', () => ({
  FEATURE_FLAGS: mockFeatureFlags,
  DEV_CONFIG: {
    DEBUGGING: {
      COMPARISON_DEBUG: false
    }
  }
}));

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

// Mock document.querySelector
const mockQuerySelector = vi.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true
});

describe('useAutoScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return enabled status', () => {
    const { result } = renderHook(() => 
      useAutoScroll({ result: null, isProcessing: false })
    );

    expect(result.current.isEnabled).toBe(true);
  });

  it('should not scroll when feature is disabled', () => {
    // Temporarily disable the feature
    mockFeatureFlags.AUTO_SCROLL_ENABLED = false;

    renderHook(() => 
      useAutoScroll({ result: { changes: [] }, isProcessing: false })
    );

    vi.advanceTimersByTime(300);
    expect(mockScrollTo).not.toHaveBeenCalled();

    // Re-enable for other tests
    mockFeatureFlags.AUTO_SCROLL_ENABLED = true;
  });

  it('should not scroll when no result', () => {
    renderHook(() => 
      useAutoScroll({ result: null, isProcessing: false })
    );

    vi.advanceTimersByTime(300);
    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('should not scroll when still processing', () => {
    renderHook(() => 
      useAutoScroll({ result: { changes: [] }, isProcessing: true })
    );

    vi.advanceTimersByTime(300);
    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('should scroll when result is ready and not processing', () => {
    // Mock DOM elements
    const mockElement = {
      getBoundingClientRect: () => ({ top: 500, height: 100 })
    };
    const mockDemoPanel = {
      getBoundingClientRect: () => ({ height: 200 })
    };

    mockQuerySelector
      .mockReturnValueOnce(mockElement) // .output-section
      .mockReturnValueOnce(mockDemoPanel); // demo panel

    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true
    });

    renderHook(() => 
      useAutoScroll({ result: { changes: [] }, isProcessing: false })
    );

    vi.advanceTimersByTime(300);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 360, // 500 (element top) - 140 (fallback demo panel height)
      behavior: 'smooth'
    });
  });

  it('should fallback to data-output-panel selector', () => {
    // Mock DOM elements - first query returns null, second returns element
    const mockElement = {
      getBoundingClientRect: () => ({ top: 300, height: 100 })
    };
    const mockDemoPanel = {
      getBoundingClientRect: () => ({ height: 150 })
    };

    mockQuerySelector
      .mockReturnValueOnce(null) // .output-section not found
      .mockReturnValueOnce(mockElement) // [data-output-panel] found
      .mockReturnValueOnce(mockDemoPanel); // demo panel

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true
    });

    renderHook(() => 
      useAutoScroll({ result: { changes: [] }, isProcessing: false })
    );

    vi.advanceTimersByTime(300);

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 90, // 300 (element top) - 210 (demo panel height + margin)
      behavior: 'smooth'
    });
  });
});
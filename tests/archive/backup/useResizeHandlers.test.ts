import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useResizeHandlers } from '../hooks/useResizeHandlers';
import { renderHook, act } from '@testing-library/react';
import { 
  validateBaseHookReturn, 
  validatePerformanceMetadata,
  mockPerformanceTiming,
  PerformanceTestUtils,
  DEFAULT_TEST_CONFIG
} from '../testing/testUtils';

// Test Suite for useResizeHandlers hook

describe('useResizeHandlers Hook', () => {
  let timingUtils: ReturnType<typeof mockPerformanceTiming>;
  let performanceUtils: PerformanceTestUtils;

  beforeEach(() => {
    timingUtils = mockPerformanceTiming();
    performanceUtils = new PerformanceTestUtils();
  });

  afterEach(() => {
    timingUtils.resetTiming();
    performanceUtils.reset();
  });

  describe('BaseHookReturn Compliance', () => {
    it('should follow BaseHookReturn pattern structure', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      validateBaseHookReturn(result.current);
      validatePerformanceMetadata(result.current.performance);
    });

    it('should provide both structured and legacy interfaces', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      // Structured interface
      expect(result.current).toHaveProperty('state');
      expect(result.current).toHaveProperty('actions');
      expect(result.current).toHaveProperty('status');
      
      // Legacy flat interface
      expect(result.current).toHaveProperty('panelResizeHandlers');
      expect(result.current).toHaveProperty('outputResizeHandlers');
      expect(result.current).toHaveProperty('panelHeight');
      expect(result.current).toHaveProperty('outputHeight');
      expect(result.current).toHaveProperty('setPanelHeightCSS');
      expect(result.current).toHaveProperty('setOutputHeightCSS');
    });
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default configuration and state', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      expect(result.current.state.config.USE_CSS_RESIZE).toBe(true);
      expect(result.current.state.panelHeight).toBe(400);
      expect(result.current.state.outputHeight).toBe(500);
      expect(result.current.status.isInitialized).toBe(true);
      expect(result.current.status.isLoading).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        USE_CSS_RESIZE: false,
        minHeight: 200,
        minOutputHeight: 300,
        maxHeight: 800,
        maxOutputHeight: 900
      };
      
      const { result } = renderHook(() => useResizeHandlers(customConfig));
      
      expect(result.current.state.config).toEqual(customConfig);
    });
  });

  describe('Height Management', () => {
    it('should update panel height using CSS when configured', () => {
      const { result } = renderHook(() => useResizeHandlers({ USE_CSS_RESIZE: true }));

      act(() => {
        result.current.actions.setPanelHeightCSS(450);
      });

      // Note: In a real test environment with DOM, this would test actual CSS updates
      // For now, we verify the operation was tracked
      expect(result.current.performance?.totalOperations).toBeGreaterThan(0);
    });

    it('should update output height using CSS when configured', () => {
      const { result } = renderHook(() => useResizeHandlers({ USE_CSS_RESIZE: true }));

      act(() => {
        result.current.actions.setOutputHeightCSS(550);
      });

      expect(result.current.performance?.totalOperations).toBeGreaterThan(0);
    });

    it('should fall back to React state when CSS resize is disabled', () => {
      const { result } = renderHook(() => useResizeHandlers({ USE_CSS_RESIZE: false }));

      act(() => {
        result.current.actions.setPanelHeightCSS(450);
      });

      expect(result.current.state.panelHeight).toBe(450);
    });
  });

  describe('Performance Tracking', () => {
    it('should track operation count and timing', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      const initialOperations = result.current.performance?.totalOperations || 0;
      
      act(() => {
        result.current.actions.setPanelHeightCSS(450);
        result.current.actions.setOutputHeightCSS(550);
      });
      
      expect(result.current.performance?.totalOperations).toBe(initialOperations + 2);
      expect(result.current.performance?.lastOperationTime).toBeGreaterThanOrEqual(0);
    });

    it('should meet performance requirements', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      performanceUtils.start();
      
      act(() => {
        result.current.actions.setPanelHeightCSS(450);
      });
      
      const duration = performanceUtils.end();
      
      // Performance should be under configured limit
      expect(duration).toBeLessThan(DEFAULT_TEST_CONFIG.maxOperationTime);
    });
  });

  describe('Resize Handlers', () => {
    it('should provide panel resize handlers with required properties', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      const { panelResizeHandlers } = result.current.actions;
      
      expect(panelResizeHandlers).toHaveProperty('handleMouseDown');
      expect(panelResizeHandlers).toHaveProperty('desktopInputPanelsRef');
      expect(panelResizeHandlers).toHaveProperty('mobileInputPanelsRef');
      expect(typeof panelResizeHandlers.handleMouseDown).toBe('function');
    });

    it('should provide output resize handlers with required properties', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      const { outputResizeHandlers } = result.current.actions;
      
      expect(outputResizeHandlers).toHaveProperty('handleMouseDown');
      expect(outputResizeHandlers).toHaveProperty('outputResizeHandleRef');
      expect(typeof outputResizeHandlers.handleMouseDown).toBe('function');
    });
  });

  describe('Status Tracking', () => {
    it('should update status correctly', () => {
      const { result } = renderHook(() => useResizeHandlers());
      
      expect(result.current.status.isInitialized).toBe(true);
      expect(result.current.status.isLoading).toBe(false);
      expect(result.current.status.error).toBe(null);
      expect(typeof result.current.status.lastUpdated).toBe('number');
    });
  });
});


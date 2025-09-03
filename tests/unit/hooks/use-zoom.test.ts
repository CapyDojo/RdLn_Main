import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the ZoomService before importing the hook
const mockZoomService = {
  getZoom: vi.fn(),
  setZoom: vi.fn(),
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  resetZoom: vi.fn(),
  isZoomSupported: vi.fn(),
  getPlatform: vi.fn(),
  addListener: vi.fn(),
};

vi.mock('@/services/ZoomService', () => ({
  ZoomService: mockZoomService
}));

// Now import the hook
import { useZoom, useZoomLevel } from '@/hooks/useZoom';

describe('useZoom', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    
    // Default mock implementations
    mockZoomService.getZoom.mockReturnValue(1.0);
    mockZoomService.setZoom.mockResolvedValue(undefined);
    mockZoomService.zoomIn.mockResolvedValue(undefined);
    mockZoomService.zoomOut.mockResolvedValue(undefined);
    mockZoomService.resetZoom.mockResolvedValue(undefined);
    mockZoomService.isZoomSupported.mockReturnValue(true);
    mockZoomService.getPlatform.mockReturnValue('web');
    mockZoomService.addListener.mockReturnValue(mockUnsubscribe);
  });

  describe('initialization', () => {
    it('should initialize with current zoom level from service', () => {
      mockZoomService.getZoom.mockReturnValue(1.5);

      const { result } = renderHook(() => useZoom());

      expect(result.current.zoomLevel).toBe(1.5);
      expect(mockZoomService.getZoom).toHaveBeenCalled();
    });

    it('should set up zoom level listener', () => {
      renderHook(() => useZoom());

      expect(mockZoomService.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should sync initial zoom level on mount', () => {
      const { result } = renderHook(() => useZoom());

      expect(mockZoomService.getZoom).toHaveBeenCalledTimes(2); // Once for state init, once for sync
    });

    it('should return platform and support information', () => {
      mockZoomService.isZoomSupported.mockReturnValue(false);
      mockZoomService.getPlatform.mockReturnValue('electron');

      const { result } = renderHook(() => useZoom());

      expect(result.current.isZoomSupported).toBe(false);
      expect(result.current.platform).toBe('electron');
    });
  });

  describe('zoom control methods', () => {
    it('should call ZoomService.setZoom when setZoom is called', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.setZoom(1.5);
      });

      expect(mockZoomService.setZoom).toHaveBeenCalledWith(1.5);
    });

    it('should call ZoomService.zoomIn with default step when zoomIn is called', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.zoomIn();
      });

      expect(mockZoomService.zoomIn).toHaveBeenCalledWith(0.1);
    });

    it('should call ZoomService.zoomIn with custom step when provided', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.zoomIn(0.2);
      });

      expect(mockZoomService.zoomIn).toHaveBeenCalledWith(0.2);
    });

    it('should call ZoomService.zoomOut with default step when zoomOut is called', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.zoomOut();
      });

      expect(mockZoomService.zoomOut).toHaveBeenCalledWith(0.1);
    });

    it('should call ZoomService.zoomOut with custom step when provided', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.zoomOut(0.25);
      });

      expect(mockZoomService.zoomOut).toHaveBeenCalledWith(0.25);
    });

    it('should call ZoomService.resetZoom when resetZoom is called', async () => {
      const { result } = renderHook(() => useZoom());

      await act(async () => {
        await result.current.resetZoom();
      });

      expect(mockZoomService.resetZoom).toHaveBeenCalled();
    });
  });

  describe('zoom level updates', () => {
    it('should update zoom level when service notifies change', () => {
      let listenerCallback: (zoomLevel: number) => void;
      mockZoomService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useZoom());

      act(() => {
        listenerCallback!(2.0);
      });

      expect(result.current.zoomLevel).toBe(2.0);
    });

    it('should handle multiple zoom level updates', () => {
      let listenerCallback: (zoomLevel: number) => void;
      mockZoomService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useZoom());

      act(() => {
        listenerCallback!(1.5);
      });
      expect(result.current.zoomLevel).toBe(1.5);

      act(() => {
        listenerCallback!(0.8);
      });
      expect(result.current.zoomLevel).toBe(0.8);
    });
  });

  describe('error handling', () => {
    it('should handle setZoom errors and re-throw them', async () => {
      const error = new Error('Zoom service error');
      mockZoomService.setZoom.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useZoom());

      await expect(async () => {
        await act(async () => {
          await result.current.setZoom(2.0);
        });
      }).rejects.toThrow('Zoom service error');

      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to set zoom:', error);
    });

    it('should handle zoomIn errors gracefully', async () => {
      const error = new Error('Zoom in failed');
      mockZoomService.zoomIn.mockRejectedValue(error);

      const { result } = renderHook(() => useZoom());

      await expect(async () => {
        await act(async () => {
          await result.current.zoomIn();
        });
      }).rejects.toThrow('Zoom in failed');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from zoom service on unmount', () => {
      const { unmount } = renderHook(() => useZoom());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should not call unsubscribe multiple times', () => {
      const { unmount } = renderHook(() => useZoom());

      unmount();
      unmount(); // Should not cause issues

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('method stability', () => {
    it('should maintain stable references for callback methods', () => {
      const { result, rerender } = renderHook(() => useZoom());

      const initialSetZoom = result.current.setZoom;
      const initialZoomIn = result.current.zoomIn;
      const initialZoomOut = result.current.zoomOut;
      const initialResetZoom = result.current.resetZoom;

      rerender();

      expect(result.current.setZoom).toBe(initialSetZoom);
      expect(result.current.zoomIn).toBe(initialZoomIn);
      expect(result.current.zoomOut).toBe(initialZoomOut);
      expect(result.current.resetZoom).toBe(initialResetZoom);
    });
  });
});

describe('useZoomLevel', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    
    mockZoomService.getZoom.mockReturnValue(1.0);
    mockZoomService.addListener.mockReturnValue(mockUnsubscribe);
  });

  describe('lightweight zoom level tracking', () => {
    it('should return current zoom level from service', () => {
      mockZoomService.getZoom.mockReturnValue(1.25);

      const { result } = renderHook(() => useZoomLevel());

      expect(result.current).toBe(1.25);
    });

    it('should update zoom level when service notifies change', () => {
      let listenerCallback: (zoomLevel: number) => void;
      mockZoomService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useZoomLevel());

      act(() => {
        listenerCallback!(1.8);
      });

      expect(result.current).toBe(1.8);
    });

    it('should sync initial zoom level on mount', () => {
      renderHook(() => useZoomLevel());

      expect(mockZoomService.getZoom).toHaveBeenCalledTimes(2); // Once for state init, once for sync
    });

    it('should unsubscribe on unmount', () => {
      const { unmount } = renderHook(() => useZoomLevel());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('performance characteristics', () => {
    it('should not provide zoom control methods', () => {
      const { result } = renderHook(() => useZoomLevel());

      expect(typeof result.current).toBe('number');
      expect(result.current).not.toHaveProperty('setZoom');
      expect(result.current).not.toHaveProperty('zoomIn');
      expect(result.current).not.toHaveProperty('zoomOut');
    });

    it('should handle rapid zoom level changes efficiently', () => {
      let listenerCallback: (zoomLevel: number) => void;
      mockZoomService.addListener.mockImplementation((callback) => {
        listenerCallback = callback;
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useZoomLevel());

      // Simulate rapid zoom changes
      act(() => {
        for (let i = 0; i < 10; i++) {
          listenerCallback!(1.0 + i * 0.1);
        }
      });

      expect(result.current).toBe(1.9);
    });
  });
});
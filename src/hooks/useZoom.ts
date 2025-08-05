import { useState, useEffect, useCallback } from 'react';
import { ZoomService } from '../services/ZoomService';

/**
 * Modern useZoom hook - replaces useZoomDetection
 * 
 * Provides unified zoom functionality across all platforms using native methods:
 * - Electron: webContents.setZoomFactor() 
 * - Tauri: webview.setZoom()
 * - Web: CSS transform scale
 * 
 * Benefits over previous approach:
 * - No manual coordinate scaling needed
 * - getBoundingClientRect() works correctly
 * - Better performance with native zoom
 * - Simplified positioning logic
 */

export interface UseZoomReturn {
  zoomLevel: number;
  setZoom: (factor: number) => Promise<void>;
  zoomIn: (step?: number) => Promise<void>;
  zoomOut: (step?: number) => Promise<void>;
  resetZoom: () => Promise<void>;
  isZoomSupported: boolean;
  platform: 'electron' | 'tauri' | 'web';
}

export const useZoom = (): UseZoomReturn => {
  const [zoomLevel, setZoomLevel] = useState(ZoomService.getZoom());

  // Listen for zoom changes from the service
  useEffect(() => {
    const unsubscribe = ZoomService.addListener((newZoomLevel) => {
      setZoomLevel(newZoomLevel);
    });

    // Sync initial zoom level
    setZoomLevel(ZoomService.getZoom());

    return unsubscribe;
  }, []);

  // Wrap ZoomService methods for React hooks
  const setZoom = useCallback(async (factor: number): Promise<void> => {
    try {
      await ZoomService.setZoom(factor);
    } catch (error) {
      console.error('❌ Failed to set zoom:', error);
      throw error;
    }
  }, []);

  const zoomIn = useCallback(async (step: number = 0.1): Promise<void> => {
    await ZoomService.zoomIn(step);
  }, []);

  const zoomOut = useCallback(async (step: number = 0.1): Promise<void> => {
    await ZoomService.zoomOut(step);
  }, []);

  const resetZoom = useCallback(async (): Promise<void> => {
    await ZoomService.resetZoom();
  }, []);

  return {
    zoomLevel,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isZoomSupported: ZoomService.isZoomSupported(),
    platform: ZoomService.getPlatform()
  };
};

/**
 * Lightweight hook for components that only need to know the current zoom level
 * Useful for positioning calculations that don't need zoom control
 */
export const useZoomLevel = (): number => {
  const [zoomLevel, setZoomLevel] = useState(ZoomService.getZoom());

  useEffect(() => {
    const unsubscribe = ZoomService.addListener(setZoomLevel);
    setZoomLevel(ZoomService.getZoom()); // Sync initial value
    return unsubscribe;
  }, []);

  return zoomLevel;
};
import { useState, useEffect } from 'react';

/**
 * Hook to detect CSS zoom changes in Electron environment
 * Monitors document.body.style.zoom changes via MutationObserver
 * Only active in Electron to avoid unnecessary overhead in web
 */
export const useZoomDetection = (): number => {
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // Only enable zoom detection in Electron environment
    if (typeof window === 'undefined' || !window.isElectron) {
      console.log('🔍 ZOOM DEBUG: Not in Electron environment, skipping zoom detection');
      return;
    }
    
    console.log('🔍 ZOOM DEBUG: Electron environment detected, setting up event listener');

    // Listen for zoom change events from the main process
    const handleZoomChange = (event: CustomEvent) => {
      const newZoomLevel = event.detail.zoomLevel;
      console.log('🔍 ZOOM EVENT RECEIVED:', newZoomLevel);
      setZoomLevel(newZoomLevel);
    };

    // Add event listener for zoom changes
    document.addEventListener('electron-zoom-change', handleZoomChange as EventListener);

    // Get initial zoom level from DOM
    const getInitialZoom = (): number => {
      const zoomValue = document.body.style.zoom;
      return zoomValue ? parseFloat(zoomValue) : 1;
    };

    const initialZoom = getInitialZoom();
    console.log('🔍 ZOOM DEBUG: Initial zoom level:', initialZoom);
    if (initialZoom !== zoomLevel) {
      setZoomLevel(initialZoom);
    }

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('electron-zoom-change', handleZoomChange as EventListener);
    };
  }, []); // Remove zoomLevel dependency to prevent infinite loop

  return zoomLevel;
};
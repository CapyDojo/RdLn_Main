/**
 * Unified Zoom Service - Cross-platform zoom management
 * 
 * Provides consistent zoom functionality across Electron, Tauri, and Web platforms
 * using the most appropriate native method for each environment:
 * - Electron: webContents.setZoomFactor() for native zoom with coordinate consistency
 * - Tauri: webview.setZoom() for native webview scaling
 * - Web: CSS transform scale for reliable positioning with getBoundingClientRect()
 */

export type ZoomChangeListener = (zoomLevel: number) => void;

export interface ZoomServiceInterface {
  setZoom(factor: number): Promise<void>;
  getZoom(): number;
  addListener(listener: ZoomChangeListener): () => void;
  isZoomSupported(): boolean;
  getPlatform(): 'electron' | 'tauri' | 'web';
}

class ZoomServiceImpl implements ZoomServiceInterface {
  private currentZoom: number = 1.0;
  private listeners: ZoomChangeListener[] = [];
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) return;

    // Get initial zoom level from platform
    this.detectInitialZoom();
    this.setupPlatformListeners();
    this.initialized = true;

    console.log(`🔍 ZoomService initialized for platform: ${this.getPlatform()}`);
  }

  private detectInitialZoom(): void {
    const platform = this.getPlatform();
    
    switch (platform) {
      case 'electron':
        // For Electron, check if there's an existing zoom from body style (migration case)
        const bodyZoom = document.body.style.zoom;
        if (bodyZoom && bodyZoom !== '1' && bodyZoom !== '') {
          this.currentZoom = parseFloat(bodyZoom) || 1.0;
          console.log(`🔍 Detected existing CSS zoom: ${this.currentZoom} (will migrate to native)`);
        }
        break;
        
      case 'tauri':
        // Tauri zoom level needs to be queried if available
        this.currentZoom = 1.0; // Default, actual level will be synced
        break;
        
      case 'web':
        // Check for existing transform scale
        const transform = document.body.style.transform;
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        if (scaleMatch) {
          this.currentZoom = parseFloat(scaleMatch[1]) || 1.0;
        }
        break;
    }
  }

  private setupPlatformListeners(): void {
    const platform = this.getPlatform();

    if (platform === 'electron') {
      // Listen for zoom changes from Electron main process
      document.addEventListener('electron-zoom-change', ((event: CustomEvent) => {
        const newZoomLevel = event.detail.zoomLevel;
        if (newZoomLevel !== this.currentZoom) {
          this.currentZoom = newZoomLevel;
          this.notifyListeners();
        }
      }) as EventListener);
    }
  }

  async setZoom(factor: number): Promise<void> {
    if (factor <= 0) {
      throw new Error('Zoom factor must be greater than 0');
    }

    // Clamp zoom level to reasonable bounds
    factor = Math.max(0.25, Math.min(3.0, factor));
    
    if (factor === this.currentZoom) {
      return; // No change needed
    }

    const platform = this.getPlatform();
    console.log(`🔍 Setting zoom to ${factor} on ${platform}`);

    try {
      switch (platform) {
        case 'electron':
          await this.setElectronZoom(factor);
          break;
          
        case 'tauri':
          await this.setTauriZoom(factor);
          break;
          
        case 'web':
          await this.setWebZoom(factor);
          break;
      }

      this.currentZoom = factor;
      this.notifyListeners();
      
    } catch (error) {
      console.error(`❌ Failed to set zoom on ${platform}:`, error);
      throw error;
    }
  }

  private async setElectronZoom(factor: number): Promise<void> {
    if (window.electronAPI?.setZoomFactor) {
      await window.electronAPI.setZoomFactor(factor);
    } else {
      // Fallback: Use webContents executeJavaScript (for migration period)
      console.warn('⚠️ electronAPI.setZoomFactor not available, using fallback');
      // This should trigger the existing zoom mechanism in main.cjs
      document.dispatchEvent(new CustomEvent('request-zoom-change', { 
        detail: { zoomLevel: factor } 
      }));
    }
  }

  private async setTauriZoom(factor: number): Promise<void> {
    try {
      const { getCurrentWebview } = await import('@tauri-apps/api/webview');
      const currentWebview = getCurrentWebview();
      await currentWebview.setZoom(factor);
    } catch (error) {
      console.warn('⚠️ Tauri zoom not available, falling back to CSS transform');
      await this.setWebZoom(factor);
    }
  }

  private async setWebZoom(factor: number): Promise<void> {
    // Use CSS transform scale - better than CSS zoom for positioning
    document.body.style.transform = `scale(${factor})`;
    document.body.style.transformOrigin = '0 0';
    
    // Adjust viewport to prevent content cutoff
    if (factor !== 1.0) {
      document.body.style.width = `${100 / factor}%`;
      document.body.style.height = `${100 / factor}%`;
    } else {
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }

  getZoom(): number {
    return this.currentZoom;
  }

  addListener(listener: ZoomChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentZoom);
      } catch (error) {
        console.error('❌ Error in zoom listener:', error);
      }
    });
  }

  isZoomSupported(): boolean {
    const platform = this.getPlatform();
    
    switch (platform) {
      case 'electron':
        return true; // Always supported
        
      case 'tauri':
        return typeof window.__TAURI__ !== 'undefined';
        
      case 'web':
        return true; // CSS transform is universally supported
        
      default:
        return false;
    }
  }

  getPlatform(): 'electron' | 'tauri' | 'web' {
    if (typeof window !== 'undefined') {
      if (window.isElectron) {
        return 'electron';
      } else if (window.__TAURI__) {
        return 'tauri';
      }
    }
    return 'web';
  }

  // Utility methods for common zoom operations
  async zoomIn(step: number = 0.1): Promise<void> {
    await this.setZoom(this.currentZoom + step);
  }

  async zoomOut(step: number = 0.1): Promise<void> {
    await this.setZoom(this.currentZoom - step);
  }

  async resetZoom(): Promise<void> {
    await this.setZoom(1.0);
  }

  // Clean up method for component unmounting
  destroy(): void {
    this.listeners = [];
    
    // Clean up web-specific styles if they were applied
    if (this.getPlatform() === 'web') {
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }
}

// Singleton instance
export const ZoomService: ZoomServiceInterface = new ZoomServiceImpl();

// Export for testing
export { ZoomServiceImpl };
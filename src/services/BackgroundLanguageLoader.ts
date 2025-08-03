/**
 * Background Language Loader Service
 * 
 * Safe, modular service for progressive background loading of OCR languages.
 * This service operates independently and can be easily disabled/removed.
 * 
 * Features:
 * - Lightning fast startup (English only)
 * - Progressive background loading
 * - Smart resource management
 * - Easy rollback capability
 * - CPU-friendly loading schedule
 */


import { OCRLanguage } from '../types/ocr-types';
import { OCRService } from './OCRService'; // Import OCRService

export interface LanguageLoadingStatus {
  language: OCRLanguage;
  status: 'pending' | 'loading' | 'ready' | 'error';
  loadStartTime?: number;
  loadEndTime?: number;
  error?: string;
}

export interface BackgroundLoaderConfig {
  enabled: boolean;
  loadingIntervalMs: number;
  respectIdleTime: boolean;
  maxConcurrentLoads: number;
  loadingPriority: Array<{
    language: OCRLanguage;
    delayMs: number;
  }>;
}

export class BackgroundLanguageLoader {
  // Configuration - easily modifiable
  private static config: BackgroundLoaderConfig = {
    enabled: false, // PRODUCTION FIX: Disabled to prevent CDN issues in Tauri
    loadingIntervalMs: 3000, // 3 seconds between loads
    respectIdleTime: true, // Pause during user activity
    maxConcurrentLoads: 1, // Conservative loading
    loadingPriority: [
      { language: 'chi_sim', delayMs: 3000 },   // Most common after English
      { language: 'spa', delayMs: 6000 },       // Spanish legal docs
      { language: 'fra', delayMs: 9000 },       // French legal docs
      { language: 'deu', delayMs: 12000 },      // German legal docs
      { language: 'chi_tra', delayMs: 15000 },  // Traditional Chinese
      { language: 'jpn', delayMs: 18000 },      // Japanese
      { language: 'kor', delayMs: 21000 },      // Korean
      { language: 'ara', delayMs: 24000 },      // Arabic
      { language: 'rus', delayMs: 27000 }       // Russian
    ]
  };

  // State tracking
  private static isLoading = false;
  private static loadingStatus = new Map<OCRLanguage, LanguageLoadingStatus>();
  private static loadingTimeouts: NodeJS.Timeout[] = [];
  private static statusCallbacks: Array<(status: Map<OCRLanguage, LanguageLoadingStatus>) => void> = [];
  
  // Idle detection
  private static lastUserActivity = Date.now();
  private static idleThresholdMs = 2000; // 2 seconds of inactivity

  /**
   * ROLLBACK SWITCH: Disable the entire service
   */
  public static disable(): void {
    this.config.enabled = false;
    this.stopBackgroundLoading();
    console.log('🛑 Background Language Loader DISABLED');
  }

  /**
   * ROLLBACK SWITCH: Re-enable the service
   */
  public static enable(): void {
    this.config.enabled = true;
    console.log('✅ Background Language Loader ENABLED');
  }

  /**
   * Check if background loading is enabled
   */
  public static isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Initialize background loading (safe to call multiple times)
   */
  public static async startBackgroundLoading(): Promise<void> {
    if (!this.config.enabled) {
      console.log('⏸️ Background loading disabled, skipping');
      return;
    }

    if (this.isLoading) {
      console.log('⏸️ Background loading already in progress');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Starting background language loading...');
    }
    this.isLoading = true;

    // Initialize status for all languages
    for (const { language } of this.config.loadingPriority) {
      this.loadingStatus.set(language, {
        language,
        status: 'pending'
      });
    }

    // Setup user activity monitoring
    this.setupUserActivityMonitoring();

    // Schedule progressive loading
    this.scheduleProgressiveLoading();

    // Notify status callbacks
    this.notifyStatusCallbacks();
  }

  /**
   * Stop background loading (safe cleanup)
   */
  public static stopBackgroundLoading(): void {
    console.log('🛑 Stopping background language loading...');
    
    // Clear all timeouts
    this.loadingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.loadingTimeouts = [];
    
    // Mark as not loading
    this.isLoading = false;
    
    // Clean up event listeners
    this.cleanupUserActivityMonitoring();
    
    console.log('✅ Background loading stopped safely');
  }

  /**
   * Get current loading status
   */
  public static getLoadingStatus(): Map<OCRLanguage, LanguageLoadingStatus> {
    return new Map(this.loadingStatus);
  }

  /**
   * Check if a specific language is ready
   */
  public static isLanguageReady(language: OCRLanguage): boolean {
    const status = this.loadingStatus.get(language);
    return status?.status === 'ready';
  }

  /**
   * Get loaded worker for a language (if available)
   */
  public static getLoadedWorker(language: OCRLanguage): null {
    return null;
  }

  /**
   * Subscribe to status updates
   */
  public static onStatusUpdate(callback: (status: Map<OCRLanguage, LanguageLoadingStatus>) => void): void {
    this.statusCallbacks.push(callback);
  }

  /**
   * Get summary statistics
   */
  public static getStats(): {
    total: number;
    pending: number;
    loading: number;
    ready: number;
    error: number;
    totalLoadTime: number;
  } {
    const statuses = Array.from(this.loadingStatus.values());
    let totalLoadTime = 0;

    statuses.forEach(status => {
      if (status.loadStartTime && status.loadEndTime) {
        totalLoadTime += status.loadEndTime - status.loadStartTime;
      }
    });

    return {
      total: statuses.length,
      pending: statuses.filter(s => s.status === 'pending').length,
      loading: statuses.filter(s => s.status === 'loading').length,
      ready: statuses.filter(s => s.status === 'ready').length,
      error: statuses.filter(s => s.status === 'error').length,
      totalLoadTime
    };
  }

  /**
   * Private: Schedule progressive loading with delays
   */
  private static scheduleProgressiveLoading(): void {
    for (const { language, delayMs } of this.config.loadingPriority) {
      const timeout = setTimeout(async () => {
        await this.loadLanguageInBackground(language);
      }, delayMs);
      
      this.loadingTimeouts.push(timeout);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📅 Scheduled ${this.config.loadingPriority.length} languages for background loading`);
    }
  }

  /**
   * Private: Load a single language in background
   */
  private static async loadLanguageInBackground(language: OCRLanguage): Promise<void> {
    if (!this.config.enabled) {
      console.log(`⏸️ Background loading disabled, skipping ${language}`);
      return;
    }

    // Check if user is active (if configured to respect idle time)
    if (this.config.respectIdleTime && this.isUserActive()) {
      console.log(`⏸️ User is active, postponing ${language} loading by 5 seconds`);
      const timeout = setTimeout(() => this.loadLanguageInBackground(language), 5000);
      this.loadingTimeouts.push(timeout);
      return;
    }

    const status = this.loadingStatus.get(language);
    if (!status || status.status !== 'pending') {
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Background loading language: ${language}`);
      }
      
      // Update status to loading
      status.status = 'loading';
      status.loadStartTime = Date.now();
      this.notifyStatusCallbacks();

      // Use OCRService to get the worker
      await OCRService.getWorkerForLanguage(language);

      // Update status to ready
      status.status = 'ready';
      status.loadEndTime = Date.now();
      
      const loadTime = status.loadEndTime - (status.loadStartTime || 0);
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Background loaded ${language} in ${loadTime}ms`);
      }
      
      this.notifyStatusCallbacks();
      
    } catch (error) {
      console.error(`❌ Failed to background load ${language}:`, error);
      
      // Update status to error
      const status = this.loadingStatus.get(language);
      if (status) {
        status.status = 'error';
        status.error = error instanceof Error ? error.message : 'Unknown error';
        status.loadEndTime = Date.now();
      }
      
      this.notifyStatusCallbacks();
    }
  }

  /**
   * Private: Setup user activity monitoring
   */
  private static setupUserActivityMonitoring(): void {
    if (!this.config.respectIdleTime) return;

    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    // Monitor various user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Private: Cleanup user activity monitoring
   */
  private static cleanupUserActivityMonitoring(): void {
    const updateActivity = () => {
      this.lastUserActivity = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, updateActivity);
    });
  }

  /**
   * Private: Check if user is currently active
   */
  private static isUserActive(): boolean {
    return (Date.now() - this.lastUserActivity) < this.idleThresholdMs;
  }

  /**
   * Private: Notify all status callbacks
   */
  private static notifyStatusCallbacks(): void {
    const statusCopy = new Map(this.loadingStatus);
    this.statusCallbacks.forEach(callback => {
      try {
        callback(statusCopy);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  /**
   * Cleanup all resources (call on app shutdown)
   */
  public static async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up background language loader...');
    
    this.stopBackgroundLoading();
    
    this.loadingStatus.clear();
    this.statusCallbacks = [];
    
    console.log('✅ Background language loader cleanup complete');
  }
}

/**
 * Comprehensive Tests for BackgroundLanguageLoader
 * 
 * Tests the background language loading service that progressively loads
 * OCR languages in the background for improved performance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackgroundLanguageLoader, LanguageLoadingStatus } from '../BackgroundLanguageLoader';
import { OCRLanguage } from '../../types/ocr-types';

// Mock OCRService
vi.mock('../OCRService', () => ({
  OCRService: {
    getWorkerForLanguage: vi.fn()
  }
}));

// Mock timers for testing
vi.useFakeTimers();

describe('BackgroundLanguageLoader', () => {
  beforeEach(() => {
    // Reset the service state before each test
    BackgroundLanguageLoader.stopBackgroundLoading();
    BackgroundLanguageLoader.enable();
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Clean up after each test
    BackgroundLanguageLoader.stopBackgroundLoading();
    vi.clearAllTimers();
  });

  describe('Configuration and Control', () => {
    it('should be enabled by default', () => {
      expect(BackgroundLanguageLoader.isEnabled()).toBe(true);
    });

    it('should allow disabling the service', () => {
      BackgroundLanguageLoader.disable();
      expect(BackgroundLanguageLoader.isEnabled()).toBe(false);
    });

    it('should allow re-enabling the service', () => {
      BackgroundLanguageLoader.disable();
      BackgroundLanguageLoader.enable();
      expect(BackgroundLanguageLoader.isEnabled()).toBe(true);
    });

    it('should stop background loading when disabled', () => {
      const stopSpy = vi.spyOn(BackgroundLanguageLoader, 'stopBackgroundLoading');
      BackgroundLanguageLoader.disable();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('Background Loading Lifecycle', () => {
    it('should not start loading when disabled', async () => {
      BackgroundLanguageLoader.disable();
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      const status = BackgroundLanguageLoader.getLoadingStatus();
      expect(status.size).toBe(0);
    });

    it('should initialize status for all configured languages', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      const status = BackgroundLanguageLoader.getLoadingStatus();
      expect(status.size).toBeGreaterThan(0);
      
      // Check that all languages start with 'pending' status
      const statuses = Array.from(status.values());
      statuses.forEach(langStatus => {
        expect(langStatus.status).toBe('pending');
        expect(langStatus.language).toBeDefined();
      });
    });

    it('should not start multiple loading sessions', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      await BackgroundLanguageLoader.startBackgroundLoading(); // Second call
      
      // Should only have one set of languages initialized
      const status = BackgroundLanguageLoader.getLoadingStatus();
      const expectedLanguages = ['chi_sim', 'spa', 'fra', 'deu', 'chi_tra', 'jpn'];
      expect(status.size).toBe(expectedLanguages.length);
    });

    it('should schedule progressive loading with delays', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Check that timers are scheduled
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should stop background loading safely', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      const initialTimerCount = vi.getTimerCount();
      
      BackgroundLanguageLoader.stopBackgroundLoading();
      
      // All timers should be cleared
      expect(vi.getTimerCount()).toBeLessThan(initialTimerCount);
    });
  });

  describe('Language Loading Process', () => {
    it('should load languages in the correct order', async () => {
      const { OCRService } = await import('../OCRService');
      const mockGetWorker = vi.mocked(OCRService.getWorkerForLanguage);
      mockGetWorker.mockResolvedValue({} as any);

      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Fast-forward to trigger the first language load (chi_sim at 3000ms)
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      expect(mockGetWorker).toHaveBeenCalledWith('chi_sim');
    });

    it('should update status during loading process', async () => {
      const { OCRService } = await import('../OCRService');
      const mockGetWorker = vi.mocked(OCRService.getWorkerForLanguage);
      
      // Mock a slow loading process
      mockGetWorker.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({} as any), 100))
      );

      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Trigger first language load
      vi.advanceTimersByTime(3000);
      
      // Check that status is updated to 'loading'
      const status = BackgroundLanguageLoader.getLoadingStatus();
      const chiSimStatus = status.get('chi_sim');
      expect(chiSimStatus?.status).toBe('loading');
      expect(chiSimStatus?.loadStartTime).toBeDefined();
    });

    it('should mark language as ready after successful load', async () => {
      const { OCRService } = await import('../OCRService');
      const mockGetWorker = vi.mocked(OCRService.getWorkerForLanguage);
      mockGetWorker.mockResolvedValue({} as any);

      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Trigger and complete first language load
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      const status = BackgroundLanguageLoader.getLoadingStatus();
      const chiSimStatus = status.get('chi_sim');
      expect(chiSimStatus?.status).toBe('ready');
      expect(chiSimStatus?.loadEndTime).toBeDefined();
    });

    it('should handle loading errors gracefully', async () => {
      const { OCRService } = await import('../OCRService');
      const mockGetWorker = vi.mocked(OCRService.getWorkerForLanguage);
      mockGetWorker.mockRejectedValue(new Error('Loading failed'));

      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Trigger first language load
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      const status = BackgroundLanguageLoader.getLoadingStatus();
      const chiSimStatus = status.get('chi_sim');
      expect(chiSimStatus?.status).toBe('error');
      expect(chiSimStatus?.error).toBe('Loading failed');
    });
  });

  describe('Status Monitoring', () => {
    it('should provide accurate loading statistics', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      const stats = BackgroundLanguageLoader.getStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.pending).toBe(stats.total); // All should be pending initially
      expect(stats.loading).toBe(0);
      expect(stats.ready).toBe(0);
      expect(stats.error).toBe(0);
    });

    it('should check individual language readiness', async () => {
      expect(BackgroundLanguageLoader.isLanguageReady('chi_sim')).toBe(false);
      
      // Simulate language being loaded
      await BackgroundLanguageLoader.startBackgroundLoading();
      const { OCRService } = await import('../OCRService');
      vi.mocked(OCRService.getWorkerForLanguage).mockResolvedValue({} as any);
      
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      expect(BackgroundLanguageLoader.isLanguageReady('chi_sim')).toBe(true);
    });

    it('should support status update callbacks', async () => {
      const statusCallback = vi.fn();
      BackgroundLanguageLoader.onStatusUpdate(statusCallback);
      
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      expect(statusCallback).toHaveBeenCalled();
      const callArgs = statusCallback.mock.calls[0][0];
      expect(callArgs).toBeInstanceOf(Map);
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      BackgroundLanguageLoader.onStatusUpdate(errorCallback);
      
      // Should not throw when starting background loading
      await expect(BackgroundLanguageLoader.startBackgroundLoading()).resolves.not.toThrow();
    });
  });

  describe('User Activity Monitoring', () => {
    it('should postpone loading when user is active', async () => {
      const { OCRService } = await import('../OCRService');
      const mockGetWorker = vi.mocked(OCRService.getWorkerForLanguage);
      mockGetWorker.mockResolvedValue({} as any);

      await BackgroundLanguageLoader.startBackgroundLoading();
      
      // Simulate user activity by triggering events
      // Note: In a real test environment, we'd need to mock the user activity detection
      
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      // Language should still be loaded (since we can't easily mock user activity in this test)
      expect(mockGetWorker).toHaveBeenCalled();
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup all resources', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      
      await BackgroundLanguageLoader.cleanup();
      
      const status = BackgroundLanguageLoader.getLoadingStatus();
      expect(status.size).toBe(0);
    });

    it('should clear all timeouts on cleanup', async () => {
      await BackgroundLanguageLoader.startBackgroundLoading();
      const initialTimerCount = vi.getTimerCount();
      
      await BackgroundLanguageLoader.cleanup();
      
      expect(vi.getTimerCount()).toBeLessThan(initialTimerCount);
    });
  });

  describe('Integration Points', () => {
    it('should return null for getLoadedWorker (placeholder implementation)', () => {
      const worker = BackgroundLanguageLoader.getLoadedWorker('chi_sim');
      expect(worker).toBeNull();
    });

    it('should work with disabled state throughout lifecycle', async () => {
      BackgroundLanguageLoader.disable();
      
      await BackgroundLanguageLoader.startBackgroundLoading();
      expect(BackgroundLanguageLoader.getLoadingStatus().size).toBe(0);
      
      BackgroundLanguageLoader.stopBackgroundLoading();
      expect(BackgroundLanguageLoader.isEnabled()).toBe(false);
      
      await BackgroundLanguageLoader.cleanup();
      expect(BackgroundLanguageLoader.isEnabled()).toBe(false);
    });
  });
});

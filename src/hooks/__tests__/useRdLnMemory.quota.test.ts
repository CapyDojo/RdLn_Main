/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRdLnMemory } from '../useRdLnMemory';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useRdLnMemory - Storage Quota Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide storage quota information', async () => {
    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.storageQuotaInfo).toBeDefined();
    expect(result.current.storageQuotaInfo.usagePercentage).toBeGreaterThanOrEqual(0);
    expect(result.current.storageQuotaInfo.totalSessions).toBe(0);
    expect(result.current.storageQuotaInfo.shouldShowWarning).toBe(false);
    expect(result.current.storageQuotaInfo.warningLevel).toBe(null);
  });

  it('should provide enhanced export functionality', async () => {
    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add a session first
    act(() => {
      result.current.saveSession('original text', 'revised text', true, 'test session');
    });

    // Test different export types
    act(() => {
      const fullExport = result.current.exportSessions('full');
      expect(fullExport).toContain('"exportType": "full"');
      expect(fullExport).toContain('"sessions"');
    });

    act(() => {
      const incrementalExport = result.current.exportSessions('incremental');
      expect(incrementalExport).toContain('"exportType": "incremental"');
    });
  });

  it('should provide auto-clean functionality', async () => {
    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add some sessions with different timestamps
    act(() => {
      result.current.saveSession('old text 1', 'old revised 1', true, 'old session 1');
      result.current.saveSession('new text 1', 'new revised 1', true, 'new session 1');
    });

    // Test auto-clean (should return number of cleaned sessions)
    let cleanedCount: number = 0;
    act(() => {
      cleanedCount = result.current.autoCleanOldSessions(30);
    });

    expect(typeof cleanedCount).toBe('number');
    expect(cleanedCount).toBeGreaterThanOrEqual(0);
  });

  it('should provide export and clean functionality', async () => {
    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Add some sessions
    act(() => {
      result.current.saveSession('text 1', 'revised 1', true, 'session 1');
      result.current.saveSession('text 2', 'revised 2', true, 'session 2');
    });

    // Test export and clean
    let exportResult: { exportData?: string; cleanedCount: number };
    act(() => {
      exportResult = result.current.exportAndClean('full', 50);
    });

    expect(exportResult!).toBeDefined();
    expect(exportResult!.cleanedCount).toBeGreaterThanOrEqual(0);
    if (exportResult!.exportData) {
      expect(exportResult!.exportData).toContain('"sessions"');
    }
  });

  it('should provide dismiss quota warning functionality', async () => {
    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Test dismiss functionality (should not throw)
    act(() => {
      result.current.dismissQuotaWarning('85%');
    });

    act(() => {
      result.current.dismissQuotaWarning();
    });

    // Should complete without errors
    expect(result.current.dismissQuotaWarning).toBeDefined();
  });

  it('should handle storage quota calculation gracefully', async () => {
    // Mock localStorage to simulate storage usage
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'rdln_memory_sessions') {
        return JSON.stringify([
          {
            id: 'test1',
            timestamp: Date.now(),
            originalText: 'test original',
            revisedText: 'test revised',
            hasResult: true,
            sessionName: 'test session',
            autoSaved: false,
            characterCount: 100,
            preview: 'test preview'
          }
        ]);
      }
      return null;
    });

    const { result } = renderHook(() => useRdLnMemory());

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.storageQuotaInfo.totalSessions).toBe(1);
    expect(result.current.storageQuotaInfo.usagePercentage).toBeGreaterThanOrEqual(0);
  });
});
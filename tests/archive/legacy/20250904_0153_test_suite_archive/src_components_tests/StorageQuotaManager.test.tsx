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

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageQuotaManager } from '../StorageQuotaManager';
import { RdLnMemoryProvider } from '../../contexts/RdLnMemoryContext';

// Mock the useRdLnMemory hook
vi.mock('../../hooks/useRdLnMemory', () => ({
  useRdLnMemory: () => ({
    sessions: [],
    hasSessions: false,
    isLoading: false,
    storageQuotaInfo: {
      usagePercentage: 80,
      totalSessions: 50,
      shouldShowWarning: true,
      warningLevel: '75%',
      newSessionsSinceExport: 5,
      lastExportDate: new Date('2025-01-01'),
    },
    saveSession: vi.fn(),
    loadSession: vi.fn(),
    deleteSession: vi.fn(),
    clearAllSessions: vi.fn(),
    generateSessionName: vi.fn(),
    exportSessions: vi.fn(() => '{"test": "export"}'),
    importSessions: vi.fn(),
    autoCleanOldSessions: vi.fn(() => 10),
    exportAndClean: vi.fn(() => ({ exportData: '{"test": "export"}', cleanedCount: 5 })),
    dismissQuotaWarning: vi.fn(),
  }),
}));

// Mock URL.createObjectURL and related APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document.createElement and related DOM APIs
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  style: { display: '' },
};

Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName) => {
    if (tagName === 'a') {
      return mockLink;
    }
    return {};
  }),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

describe('StorageQuotaManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RdLnMemoryProvider>
      {children}
    </RdLnMemoryProvider>
  );

  it('should render modal when storage quota warning should be shown', () => {
    render(
      <TestWrapper>
        <StorageQuotaManager />
      </TestWrapper>
    );

    expect(screen.getByText('Storage Getting Full')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should not render modal when storage quota warning should not be shown', () => {
    // Mock the hook to return no warning
    vi.doMock('../../hooks/useRdLnMemory', () => ({
      useRdLnMemory: () => ({
        sessions: [],
        hasSessions: false,
        isLoading: false,
        storageQuotaInfo: {
          usagePercentage: 50,
          totalSessions: 25,
          shouldShowWarning: false,
          warningLevel: null,
          newSessionsSinceExport: 0,
        },
        saveSession: vi.fn(),
        loadSession: vi.fn(),
        deleteSession: vi.fn(),
        clearAllSessions: vi.fn(),
        generateSessionName: vi.fn(),
        exportSessions: vi.fn(),
        importSessions: vi.fn(),
        autoCleanOldSessions: vi.fn(),
        exportAndClean: vi.fn(),
        dismissQuotaWarning: vi.fn(),
      }),
    }));

    render(
      <TestWrapper>
        <StorageQuotaManager />
      </TestWrapper>
    );

    expect(screen.queryByText('Storage Getting Full')).not.toBeInTheDocument();
  });

  it('should integrate with RdLnMemoryProvider correctly', () => {
    // This test verifies that the StorageQuotaManager can be rendered
    // within the RdLnMemoryProvider without errors
    expect(() => {
      render(
        <TestWrapper>
          <StorageQuotaManager />
        </TestWrapper>
      );
    }).not.toThrow();
  });
});
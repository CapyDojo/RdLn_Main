/**
 * RdLn Memory Context Synchronization Tests
 * 
 * Focused tests for context provider synchronization behavior
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { RdLnMemoryProvider, useRdLnMemoryContext } from '../../src/contexts/RdLnMemoryContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Test wrapper for context provider
const wrapper = ({ children }: { children: React.ReactNode }) => 
  React.createElement(RdLnMemoryProvider, null, children);

describe('RdLn Memory Context Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Context Provider Integration', () => {
    it('should provide consistent state across multiple hook instances', () => {
      // Render multiple hook instances
      const { result: result1 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      const { result: result2 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Both should have the same initial state
      expect(result1.current.sessions).toEqual(result2.current.sessions);
      expect(result1.current.hasSessions).toBe(result2.current.hasSessions);
    });

    it('should synchronize state changes across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      const { result: result2 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Mock localStorage to return a session after save
      const mockSession = {
        id: 'test-session-1',
        timestamp: Date.now(),
        originalText: 'Test original',
        revisedText: 'Test revised',
        hasResult: false,
        sessionName: 'Test Session',
        autoSaved: false,
        characterCount: 25,
        preview: 'Test original'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Save session using first hook instance
      act(() => {
        result1.current.saveSession('Test original', 'Test revised', false);
      });
      
      // Both hook instances should see the new session
      expect(result1.current.sessions).toHaveLength(1);
      expect(result2.current.sessions).toHaveLength(1);
      expect(result1.current.hasSessions).toBe(true);
      expect(result2.current.hasSessions).toBe(true);
    });

    it('should handle session deletion synchronization', () => {
      // Setup with existing session
      const mockSession = {
        id: 'test-session-1',
        timestamp: Date.now(),
        originalText: 'Test original',
        revisedText: 'Test revised',
        hasResult: false,
        sessionName: 'Test Session',
        autoSaved: false,
        characterCount: 25,
        preview: 'Test original'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      const { result: result1 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      const { result: result2 } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Both should see the initial session
      expect(result1.current.sessions).toHaveLength(1);
      expect(result2.current.sessions).toHaveLength(1);
      
      // Mock localStorage to return empty array after deletion
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      // Delete session using first hook instance
      act(() => {
        result1.current.deleteSession('test-session-1');
      });
      
      // Both hook instances should see the session is gone
      expect(result1.current.sessions).toHaveLength(0);
      expect(result2.current.sessions).toHaveLength(0);
      expect(result1.current.hasSessions).toBe(false);
      expect(result2.current.hasSessions).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useRdLnMemoryContext());
      }).toThrow('useRdLnMemoryContext must be used within RdLnMemoryProvider');
    });
  });

  describe('Session Management Operations', () => {
    it('should handle save operations consistently', () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      const mockSession = {
        id: 'new-session',
        timestamp: Date.now(),
        originalText: 'Original content',
        revisedText: 'Revised content',
        hasResult: true,
        sessionName: 'New Session',
        autoSaved: false,
        characterCount: 32,
        preview: 'Original content'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      act(() => {
        const sessionId = result.current.saveSession('Original content', 'Revised content', true);
        expect(typeof sessionId).toBe('string');
      });
      
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.hasSessions).toBe(true);
    });

    it('should handle load operations correctly', () => {
      const mockSession = {
        id: 'load-test-session',
        timestamp: Date.now(),
        originalText: 'Load test original',
        revisedText: 'Load test revised',
        hasResult: false,
        sessionName: 'Load Test Session',
        autoSaved: false,
        characterCount: 35,
        preview: 'Load test original'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      act(() => {
        const loadedSession = result.current.loadSession('load-test-session');
        expect(loadedSession).toEqual(mockSession);
      });
    });

    it('should handle export/import operations', () => {
      const mockSessions = [
        {
          id: 'export-session-1',
          timestamp: Date.now(),
          originalText: 'Export test 1',
          revisedText: 'Export revised 1',
          hasResult: false,
          sessionName: 'Export Session 1',
          autoSaved: false,
          characterCount: 28,
          preview: 'Export test 1'
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessions));
      
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Test export
      act(() => {
        const exportData = result.current.exportSessions();
        expect(typeof exportData).toBe('string');
        expect(JSON.parse(exportData)).toEqual(mockSessions);
      });
      
      // Test import
      const importData = JSON.stringify(mockSessions);
      act(() => {
        const success = result.current.importSessions(importData);
        expect(success).toBe(true);
      });
    });
  });

  describe('Real-time Synchronization Requirements', () => {
    it('should satisfy Requirement 1.1: Immediate visibility across components', () => {
      const { result: sidePanel } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      const { result: dropdown } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      const mockSession = {
        id: 'req-1-1-session',
        timestamp: Date.now(),
        originalText: 'Requirement 1.1 test',
        revisedText: 'Requirement 1.1 revised',
        hasResult: false,
        sessionName: 'Req 1.1 Session',
        autoSaved: false,
        characterCount: 42,
        preview: 'Requirement 1.1 test'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Save in side panel
      act(() => {
        sidePanel.current.saveSession('Requirement 1.1 test', 'Requirement 1.1 revised', false);
      });
      
      // Should appear immediately in dropdown
      expect(dropdown.current.sessions).toHaveLength(1);
      expect(dropdown.current.sessions[0].sessionName).toBe('Req 1.1 Session');
    });

    it('should satisfy Requirement 1.2: Immediate removal across components', () => {
      const mockSession = {
        id: 'req-1-2-session',
        timestamp: Date.now(),
        originalText: 'Requirement 1.2 test',
        revisedText: 'Requirement 1.2 revised',
        hasResult: false,
        sessionName: 'Req 1.2 Session',
        autoSaved: false,
        characterCount: 42,
        preview: 'Requirement 1.2 test'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      const { result: dropdown } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      const { result: sidePanel } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Both should see the session initially
      expect(dropdown.current.sessions).toHaveLength(1);
      expect(sidePanel.current.sessions).toHaveLength(1);
      
      // Mock empty array after deletion
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      // Delete in dropdown
      act(() => {
        dropdown.current.deleteSession('req-1-2-session');
      });
      
      // Should disappear immediately from side panel
      expect(sidePanel.current.sessions).toHaveLength(0);
      expect(sidePanel.current.hasSessions).toBe(false);
    });

    it('should satisfy Requirement 1.4: No page reload required', () => {
      // Monitor for any reload attempts
      let reloadAttempted = false;
      const originalReload = window.location.reload;
      Object.defineProperty(window.location, 'reload', {
        value: () => { reloadAttempted = true; },
        writable: true,
      });
      
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      const mockSession = {
        id: 'no-reload-session',
        timestamp: Date.now(),
        originalText: 'No reload test',
        revisedText: 'No reload revised',
        hasResult: false,
        sessionName: 'No Reload Session',
        autoSaved: false,
        characterCount: 30,
        preview: 'No reload test'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Perform multiple operations
      act(() => {
        result.current.saveSession('No reload test', 'No reload revised', false);
      });
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      act(() => {
        result.current.deleteSession('no-reload-session');
      });
      
      // Verify no reload was attempted
      expect(reloadAttempted).toBe(false);
      
      // Restore original reload
      Object.defineProperty(window.location, 'reload', {
        value: originalReload,
        writable: true,
      });
    });
  });
});
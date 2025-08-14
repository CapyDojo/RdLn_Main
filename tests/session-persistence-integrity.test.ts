/**
 * Session Persistence and Data Integrity Tests
 * 
 * Tests for RdLn Memory session persistence after page reload,
 * data integrity after migration, export/import functionality,
 * and localStorage error handling.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { RdLnMemoryProvider, useRdLnMemoryContext } from '../src/contexts/RdLnMemoryContext';

// Mock localStorage with full implementation
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return { ...store };
    },
    setStore(newStore: Record<string, string>) {
      store = { ...newStore };
    }
  };
};

let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

// Test wrapper for context provider
const wrapper = ({ children }: { children: React.ReactNode }) => 
  React.createElement(RdLnMemoryProvider, null, children);

describe('Session Persistence and Data Integrity', () => {
  beforeEach(() => {
    // Create fresh mock localStorage for each test
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3.1: Session Persistence After Page Reload', () => {
    it('should persist sessions correctly after page reload simulation', async () => {
      // Create initial sessions
      const mockSessions = [
        {
          id: 'persist-session-1',
          timestamp: Date.now() - 1000,
          originalText: 'Original content for persistence test',
          revisedText: 'Revised content for persistence test',
          hasResult: true,
          sessionName: 'Persistence Test Session 1',
          autoSaved: false,
          characterCount: 65,
          preview: 'Original content for persistence test'
        },
        {
          id: 'persist-session-2',
          timestamp: Date.now(),
          originalText: 'Second original content',
          revisedText: 'Second revised content',
          hasResult: false,
          sessionName: 'Persistence Test Session 2',
          autoSaved: true,
          characterCount: 45,
          preview: 'Second original content'
        }
      ];

      // Set up localStorage with existing sessions
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(mockSessions));

      // First render - simulate initial page load
      const { result: firstRender } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify sessions are loaded correctly
      expect(firstRender.current.sessions).toHaveLength(2);
      expect(firstRender.current.sessions[0].sessionName).toBe('Persistence Test Session 2'); // Newest first
      expect(firstRender.current.sessions[1].sessionName).toBe('Persistence Test Session 1');
      expect(firstRender.current.hasSessions).toBe(true);
      expect(firstRender.current.isLoading).toBe(false);

      // Simulate page reload by creating a new hook instance
      const { result: secondRender } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify sessions persist after "reload"
      expect(secondRender.current.sessions).toHaveLength(2);
      expect(secondRender.current.sessions[0].sessionName).toBe('Persistence Test Session 2');
      expect(secondRender.current.sessions[1].sessionName).toBe('Persistence Test Session 1');
      expect(secondRender.current.hasSessions).toBe(true);
      expect(secondRender.current.isLoading).toBe(false);

      // Verify data integrity - all fields preserved
      const persistedSession1 = secondRender.current.sessions.find(s => s.id === 'persist-session-1');
      expect(persistedSession1).toEqual(mockSessions[0]);

      const persistedSession2 = secondRender.current.sessions.find(s => s.id === 'persist-session-2');
      expect(persistedSession2).toEqual(mockSessions[1]);
    });

    it('should handle empty localStorage gracefully on page reload', async () => {
      // Start with empty localStorage
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      // Wait for loading to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify empty state is handled correctly
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain session order after page reload', async () => {
      const now = Date.now();
      const mockSessions = [
        {
          id: 'order-session-1',
          timestamp: now - 3000,
          originalText: 'Oldest session',
          revisedText: 'Oldest revised',
          hasResult: false,
          sessionName: 'Oldest Session',
          autoSaved: false,
          characterCount: 25,
          preview: 'Oldest session'
        },
        {
          id: 'order-session-2',
          timestamp: now - 1000,
          originalText: 'Newest session',
          revisedText: 'Newest revised',
          hasResult: true,
          sessionName: 'Newest Session',
          autoSaved: false,
          characterCount: 25,
          preview: 'Newest session'
        },
        {
          id: 'order-session-3',
          timestamp: now - 2000,
          originalText: 'Middle session',
          revisedText: 'Middle revised',
          hasResult: false,
          sessionName: 'Middle Session',
          autoSaved: true,
          characterCount: 25,
          preview: 'Middle session'
        }
      ];

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(mockSessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify sessions are ordered by timestamp (newest first)
      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions[0].sessionName).toBe('Newest Session');
      expect(result.current.sessions[1].sessionName).toBe('Middle Session');
      expect(result.current.sessions[2].sessionName).toBe('Oldest Session');
    });
  });

  describe('Requirement 3.2: Existing Sessions Continue to Work After Migration', () => {
    it('should validate and preserve all session fields after migration', async () => {
      const legacySession = {
        id: 'legacy-session-1',
        timestamp: Date.now(),
        originalText: 'Legacy original text',
        revisedText: 'Legacy revised text',
        hasResult: true,
        sessionName: 'Legacy Session',
        autoSaved: false,
        characterCount: 35,
        preview: 'Legacy original text'
      };

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([legacySession]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify legacy session is loaded correctly
      expect(result.current.sessions).toHaveLength(1);
      const loadedSession = result.current.sessions[0];
      
      // Verify all fields are preserved
      expect(loadedSession.id).toBe('legacy-session-1');
      expect(loadedSession.originalText).toBe('Legacy original text');
      expect(loadedSession.revisedText).toBe('Legacy revised text');
      expect(loadedSession.hasResult).toBe(true);
      expect(loadedSession.sessionName).toBe('Legacy Session');
      expect(loadedSession.autoSaved).toBe(false);
      expect(loadedSession.characterCount).toBe(35);
      expect(loadedSession.preview).toBe('Legacy original text');

      // Test that legacy session can be loaded
      const loadedSessionData = result.current.loadSession('legacy-session-1');
      expect(loadedSessionData).toEqual(legacySession);
    });

    it('should filter out corrupted sessions while preserving valid ones', async () => {
      const mixedSessions = [
        // Valid session
        {
          id: 'valid-session',
          timestamp: Date.now(),
          originalText: 'Valid original',
          revisedText: 'Valid revised',
          hasResult: false,
          sessionName: 'Valid Session',
          autoSaved: true,
          characterCount: 25,
          preview: 'Valid original'
        },
        // Corrupted session - missing required fields
        {
          id: 'corrupted-session',
          timestamp: 'invalid-timestamp', // Should be number
          originalText: 'Corrupted original',
          // Missing revisedText
          hasResult: 'not-boolean', // Should be boolean
          sessionName: 'Corrupted Session'
          // Missing other required fields
        },
        // Another valid session
        {
          id: 'another-valid-session',
          timestamp: Date.now() - 1000,
          originalText: 'Another valid original',
          revisedText: 'Another valid revised',
          hasResult: true,
          sessionName: 'Another Valid Session',
          autoSaved: false,
          characterCount: 45,
          preview: 'Another valid original'
        }
      ];

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(mixedSessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should only load valid sessions
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.sessions.find(s => s.id === 'valid-session')).toBeDefined();
      expect(result.current.sessions.find(s => s.id === 'another-valid-session')).toBeDefined();
      expect(result.current.sessions.find(s => s.id === 'corrupted-session')).toBeUndefined();
    });

    it('should maintain backward compatibility with session operations', async () => {
      const legacySession = {
        id: 'legacy-ops-session',
        timestamp: Date.now(),
        originalText: 'Legacy operations test',
        revisedText: 'Legacy operations revised',
        hasResult: false,
        sessionName: 'Legacy Operations Session',
        autoSaved: true,
        characterCount: 45,
        preview: 'Legacy operations test'
      };

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([legacySession]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test load operation
      const loadedSession = result.current.loadSession('legacy-ops-session');
      expect(loadedSession).toEqual(legacySession);

      // Test delete operation
      act(() => {
        result.current.deleteSession('legacy-ops-session');
      });

      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);

      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'rdln_memory_sessions',
        JSON.stringify([])
      );
    });
  });

  describe('Requirement 3.3: Export/Import Functionality Works Unchanged', () => {
    it('should export sessions in correct format', async () => {
      const testSessions = [
        {
          id: 'export-session-1',
          timestamp: Date.now() - 1000,
          originalText: 'Export test original 1',
          revisedText: 'Export test revised 1',
          hasResult: true,
          sessionName: 'Export Test Session 1',
          autoSaved: false,
          characterCount: 40,
          preview: 'Export test original 1'
        },
        {
          id: 'export-session-2',
          timestamp: Date.now(),
          originalText: 'Export test original 2',
          revisedText: 'Export test revised 2',
          hasResult: false,
          sessionName: 'Export Test Session 2',
          autoSaved: true,
          characterCount: 40,
          preview: 'Export test original 2'
        }
      ];

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(testSessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test export
      let exportData: string;
      act(() => {
        exportData = result.current.exportSessions();
      });

      // Verify export format
      const parsedExport = JSON.parse(exportData!);
      expect(parsedExport).toHaveProperty('exportDate');
      expect(parsedExport).toHaveProperty('version', '1.0');
      expect(parsedExport).toHaveProperty('sessions');
      expect(parsedExport.sessions).toHaveLength(2);
      expect(parsedExport.sessions).toEqual(expect.arrayContaining(testSessions));

      // Verify export date is valid ISO string
      expect(new Date(parsedExport.exportDate).toISOString()).toBe(parsedExport.exportDate);
    });

    it('should import sessions correctly and merge with existing ones', async () => {
      // Start with existing session
      const existingSession = {
        id: 'existing-session',
        timestamp: Date.now() - 2000,
        originalText: 'Existing original',
        revisedText: 'Existing revised',
        hasResult: false,
        sessionName: 'Existing Session',
        autoSaved: true,
        characterCount: 30,
        preview: 'Existing original'
      };

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([existingSession]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify existing session is loaded
      expect(result.current.sessions).toHaveLength(1);

      // Prepare import data
      const importSessions = [
        {
          id: 'import-session-1',
          timestamp: Date.now() - 1000,
          originalText: 'Import original 1',
          revisedText: 'Import revised 1',
          hasResult: true,
          sessionName: 'Import Session 1',
          autoSaved: false,
          characterCount: 30,
          preview: 'Import original 1'
        },
        {
          id: 'import-session-2',
          timestamp: Date.now(),
          originalText: 'Import original 2',
          revisedText: 'Import revised 2',
          hasResult: false,
          sessionName: 'Import Session 2',
          autoSaved: true,
          characterCount: 30,
          preview: 'Import original 2'
        }
      ];

      const importData = JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessions: importSessions
      });

      // Test import
      let importResult: boolean;
      act(() => {
        importResult = result.current.importSessions(importData);
      });

      expect(importResult!).toBe(true);

      // Verify sessions are merged correctly
      expect(result.current.sessions).toHaveLength(3);
      
      // Verify all sessions are present (newest first)
      const sessionNames = result.current.sessions.map(s => s.sessionName);
      expect(sessionNames).toContain('Import Session 2'); // Newest
      expect(sessionNames).toContain('Import Session 1');
      expect(sessionNames).toContain('Existing Session'); // Oldest
    });

    it('should handle import of duplicate sessions correctly', async () => {
      const originalSession = {
        id: 'duplicate-session',
        timestamp: Date.now(),
        originalText: 'Duplicate test',
        revisedText: 'Duplicate revised',
        hasResult: false,
        sessionName: 'Duplicate Session',
        autoSaved: false,
        characterCount: 25,
        preview: 'Duplicate test'
      };

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([originalSession]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Try to import the same session
      const importData = JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessions: [originalSession] // Same session
      });

      let importResult: boolean;
      act(() => {
        importResult = result.current.importSessions(importData);
      });

      expect(importResult!).toBe(true);

      // Should still have only one session (no duplicates)
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe('duplicate-session');
    });

    it('should handle invalid import data gracefully', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test invalid JSON
      let importResult1: boolean;
      act(() => {
        importResult1 = result.current.importSessions('invalid json');
      });
      expect(importResult1!).toBe(false);

      // Test missing sessions array
      let importResult2: boolean;
      act(() => {
        importResult2 = result.current.importSessions(JSON.stringify({ version: '1.0' }));
      });
      expect(importResult2!).toBe(false);

      // Test empty sessions array
      let importResult3: boolean;
      act(() => {
        importResult3 = result.current.importSessions(JSON.stringify({ sessions: [] }));
      });
      expect(importResult3!).toBe(false);

      // Verify no sessions were added
      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe('Requirement 3.4: localStorage Error Handling Continues to Work', () => {
    it('should handle localStorage getItem failures gracefully', async () => {
      // Mock localStorage.getItem to throw error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should handle error gracefully and start with empty sessions
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);
      expect(result.current.isLoading).toBe(false);

      // Should have called removeItem to clean up corrupted data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rdln_memory_sessions');
    });

    it('should handle localStorage setItem failures with quota exceeded', async () => {
      // Start with empty localStorage
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock setItem to throw quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      // Try to save a session
      act(() => {
        result.current.saveSession(
          'Large content that exceeds quota',
          'Large revised content that exceeds quota',
          false,
          'Quota Test Session'
        );
      });

      // Should handle the error gracefully
      expect(result.current.sessions).toHaveLength(1); // Session added to state
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle corrupted localStorage data', async () => {
      // Set corrupted JSON data
      mockLocalStorage.setItem('rdln_memory_sessions', 'corrupted json data {');

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should handle corrupted data gracefully
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);
      expect(result.current.isLoading).toBe(false);

      // Should clean up corrupted data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rdln_memory_sessions');
    });

    it('should implement fallback storage reduction when quota exceeded', async () => {
      // Create many sessions to simulate quota issues
      const manySessions = Array.from({ length: 99 }, (_, i) => ({
        id: `session-${i}`,
        timestamp: Date.now() - i * 1000,
        originalText: `Original content ${i}`,
        revisedText: `Revised content ${i}`,
        hasResult: i % 2 === 0,
        sessionName: `Session ${i}`,
        autoSaved: i % 3 === 0,
        characterCount: 30,
        preview: `Original content ${i}`
      }));

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(manySessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify all sessions loaded initially
      expect(result.current.sessions).toHaveLength(99);

      // Clear the mock call count from initial loading
      mockLocalStorage.setItem.mockClear();

      // Mock setItem to fail first time (quota exceeded), succeed second time
      let setItemCallCount = 0;
      mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
        setItemCallCount++;
        if (setItemCallCount === 1) {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }
        // Second call should succeed (reduced sessions)
        return;
      });

      // Add a new session to trigger save
      act(() => {
        result.current.saveSession(
          'New session content',
          'New session revised',
          false,
          'New Session'
        );
      });

      // Should have attempted to save at least twice (original + fallback)
      // The hook may make additional calls due to React's effect behavior
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'rdln_memory_sessions',
        expect.any(String)
      );
      expect(setItemCallCount).toBeGreaterThanOrEqual(2);
      
      // Should have reduced sessions in state due to quota handling
      expect(result.current.sessions.length).toBeLessThanOrEqual(50); // Half of max + new session
    });

    it('should handle complete localStorage failure gracefully', async () => {
      // Mock all localStorage methods to fail, but suppress console errors for this test
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;
      console.warn = vi.fn();
      console.error = vi.fn();

      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage completely unavailable');
      });
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage completely unavailable');
      });
      mockLocalStorage.removeItem.mockImplementation(() => {
        // Don't throw for removeItem as it's called in error cleanup
        return;
      });

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should still work in memory-only mode
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);

      // Should be able to save sessions in memory
      act(() => {
        result.current.saveSession(
          'Memory only session',
          'Memory only revised',
          false,
          'Memory Session'
        );
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Memory Session');
      expect(result.current.hasSessions).toBe(true);

      // Should be able to delete sessions from memory
      const sessionId = result.current.sessions[0].id;
      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);

      // Restore console methods
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    });
  });

  describe('Data Integrity Validation', () => {
    it('should maintain data consistency across all operations', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Save multiple sessions
      let sessionId1: string, sessionId2: string;
      act(() => {
        sessionId1 = result.current.saveSession(
          'Integrity test 1',
          'Integrity revised 1',
          true,
          'Integrity Session 1'
        );
        sessionId2 = result.current.saveSession(
          'Integrity test 2',
          'Integrity revised 2',
          false,
          'Integrity Session 2'
        );
      });

      // Verify sessions are saved correctly
      expect(result.current.sessions).toHaveLength(2);
      
      // Load sessions and verify data integrity
      const loadedSession1 = result.current.loadSession(sessionId1!);
      const loadedSession2 = result.current.loadSession(sessionId2!);

      expect(loadedSession1).toBeTruthy();
      expect(loadedSession1!.originalText).toBe('Integrity test 1');
      expect(loadedSession1!.revisedText).toBe('Integrity revised 1');
      expect(loadedSession1!.hasResult).toBe(true);
      expect(loadedSession1!.sessionName).toBe('Integrity Session 1');

      expect(loadedSession2).toBeTruthy();
      expect(loadedSession2!.originalText).toBe('Integrity test 2');
      expect(loadedSession2!.revisedText).toBe('Integrity revised 2');
      expect(loadedSession2!.hasResult).toBe(false);
      expect(loadedSession2!.sessionName).toBe('Integrity Session 2');

      // Export and verify data integrity
      const exportData = result.current.exportSessions();
      const parsedExport = JSON.parse(exportData);
      
      expect(parsedExport.sessions).toHaveLength(2);
      expect(parsedExport.sessions.find((s: any) => s.id === sessionId1)).toEqual(loadedSession1);
      expect(parsedExport.sessions.find((s: any) => s.id === sessionId2)).toEqual(loadedSession2);

      // Clear and import to verify round-trip integrity
      act(() => {
        result.current.clearAllSessions();
      });

      expect(result.current.sessions).toHaveLength(0);

      act(() => {
        const importSuccess = result.current.importSessions(exportData);
        expect(importSuccess).toBe(true);
      });

      // Verify imported data maintains integrity
      expect(result.current.sessions).toHaveLength(2);
      const reimportedSession1 = result.current.loadSession(sessionId1!);
      const reimportedSession2 = result.current.loadSession(sessionId2!);

      expect(reimportedSession1).toEqual(loadedSession1);
      expect(reimportedSession2).toEqual(loadedSession2);
    });
  });
});
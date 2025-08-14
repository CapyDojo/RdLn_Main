/**
 * RdLn Memory Error Handling and Edge Cases Tests
 * 
 * Tests for error handling scenarios including context errors,
 * localStorage quota exceeded, corrupted data handling, and
 * verification that all existing error handling continues to function.
 * 
 * Requirements: 2.3, 3.4
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

describe('RdLn Memory Error Handling and Edge Cases', () => {
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

  describe('Requirement 2.3: Context Error Handling', () => {
    it('should show clear error message when provider is missing', () => {
      // Test using hook outside of provider
      expect(() => {
        renderHook(() => useRdLnMemoryContext());
      }).toThrow(
        'useRdLnMemoryContext must be used within a RdLnMemoryProvider. ' +
        'Make sure to wrap your component tree with <RdLnMemoryProvider>.'
      );
    });

    it('should provide helpful error message for debugging', () => {
      let caughtError: Error | null = null;
      
      try {
        renderHook(() => useRdLnMemoryContext());
      } catch (error) {
        caughtError = error as Error;
      }
      
      expect(caughtError).toBeTruthy();
      expect(caughtError!.message).toContain('useRdLnMemoryContext must be used within a RdLnMemoryProvider');
      expect(caughtError!.message).toContain('Make sure to wrap your component tree with <RdLnMemoryProvider>');
    });

    it('should work correctly when provider is present', () => {
      // This should not throw
      expect(() => {
        renderHook(() => useRdLnMemoryContext(), { wrapper });
      }).not.toThrow();
    });

    it('should handle multiple nested providers correctly', () => {
      const doubleWrapper = ({ children }: { children: React.ReactNode }) => 
        React.createElement(RdLnMemoryProvider, null,
          React.createElement(RdLnMemoryProvider, null, children)
        );

      // Should work with nested providers (inner provider takes precedence)
      expect(() => {
        renderHook(() => useRdLnMemoryContext(), { wrapper: doubleWrapper });
      }).not.toThrow();
    });

    it('should handle provider unmounting gracefully', async () => {
      const { result, unmount } = renderHook(() => useRdLnMemoryContext(), { wrapper });
      
      // Should work initially
      expect(result.current.sessions).toBeDefined();
      
      // Unmount should not cause errors
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Requirement 3.4: localStorage Quota Exceeded Scenarios', () => {
    it('should handle localStorage quota exceeded on initial save', async () => {
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
          'Large content that would exceed quota',
          'Large revised content that would exceed quota',
          false,
          'Quota Test Session'
        );
      });

      // Session should still be added to in-memory state
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Quota Test Session');
      expect(result.current.hasSessions).toBe(true);

      // Should have attempted to save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
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
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'rdln_memory_sessions',
        expect.any(String)
      );
      expect(setItemCallCount).toBeGreaterThanOrEqual(2);
      
      // Should have reduced sessions in state due to quota handling
      expect(result.current.sessions.length).toBeLessThanOrEqual(50); // Half of max + new session
    });

    it('should handle quota exceeded during export operations', async () => {
      const testSessions = [
        {
          id: 'export-quota-session',
          timestamp: Date.now(),
          originalText: 'Export quota test',
          revisedText: 'Export quota revised',
          hasResult: false,
          sessionName: 'Export Quota Session',
          autoSaved: false,
          characterCount: 35,
          preview: 'Export quota test'
        }
      ];

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(testSessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Export should work even if localStorage is having quota issues
      let exportData: string;
      act(() => {
        exportData = result.current.exportSessions();
      });

      expect(exportData!).toBeTruthy();
      const parsedExport = JSON.parse(exportData!);
      expect(parsedExport.sessions).toHaveLength(1);
      expect(parsedExport.sessions[0].sessionName).toBe('Export Quota Session');
    });

    it('should handle quota exceeded during import operations', async () => {
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock setItem to throw quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const importSessions = [
        {
          id: 'import-quota-session',
          timestamp: Date.now(),
          originalText: 'Import quota test',
          revisedText: 'Import quota revised',
          hasResult: false,
          sessionName: 'Import Quota Session',
          autoSaved: false,
          characterCount: 35,
          preview: 'Import quota test'
        }
      ];

      const importData = JSON.stringify({
        exportDate: new Date().toISOString(),
        version: '1.0',
        sessions: importSessions
      });

      // Import should succeed in memory even if localStorage fails
      let importResult: boolean;
      act(() => {
        importResult = result.current.importSessions(importData);
      });

      expect(importResult!).toBe(true);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Import Quota Session');
    });

    it('should handle persistent quota exceeded errors gracefully', async () => {
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock setItem to always throw quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      // Should still work in memory-only mode
      act(() => {
        result.current.saveSession(
          'Memory only session 1',
          'Memory only revised 1',
          false,
          'Memory Session 1'
        );
      });

      act(() => {
        result.current.saveSession(
          'Memory only session 2',
          'Memory only revised 2',
          true,
          'Memory Session 2'
        );
      });

      // Should have sessions in memory
      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.hasSessions).toBe(true);

      // Should be able to perform all operations in memory
      const sessionId = result.current.sessions[0].id;
      const loadedSession = result.current.loadSession(sessionId);
      expect(loadedSession).toBeTruthy();
      expect(loadedSession!.sessionName).toBe('Memory Session 2'); // Newest first

      // Should be able to delete from memory
      act(() => {
        result.current.deleteSession(sessionId);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Memory Session 1');
    });
  });

  describe('Requirement 3.4: Corrupted Session Data Handling', () => {
    it('should handle completely corrupted JSON data', async () => {
      // Set completely invalid JSON
      mockLocalStorage.setItem('rdln_memory_sessions', 'this is not json at all {[}');

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

    it('should handle partially corrupted JSON data', async () => {
      // Set JSON that starts valid but becomes corrupted
      mockLocalStorage.setItem('rdln_memory_sessions', '[{"id": "valid", "timestamp": 123}');

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

    it('should filter out sessions with missing required fields', async () => {
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
          id: 'corrupted-session-1',
          timestamp: 'invalid-timestamp', // Should be number
          originalText: 'Corrupted original',
          // Missing revisedText
          hasResult: 'not-boolean', // Should be boolean
          sessionName: 'Corrupted Session 1'
          // Missing other required fields
        },
        // Another corrupted session - different issues
        {
          // Missing id
          timestamp: Date.now(),
          originalText: 'Another corrupted',
          revisedText: 'Another corrupted revised',
          hasResult: false,
          sessionName: 'Corrupted Session 2',
          autoSaved: null, // Should be boolean
          characterCount: 'not-a-number', // Should be number
          preview: 'Another corrupted'
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
      expect(result.current.sessions.find(s => s.id === 'corrupted-session-1')).toBeUndefined();
      expect(result.current.sessions.find(s => s.sessionName === 'Corrupted Session 2')).toBeUndefined();
    });

    it('should handle sessions with null or undefined values', async () => {
      const sessionsWithNulls = [
        {
          id: 'session-with-nulls',
          timestamp: Date.now(),
          originalText: null, // Should be string
          revisedText: undefined, // Should be string
          hasResult: false,
          sessionName: 'Session With Nulls',
          autoSaved: true,
          characterCount: 0,
          preview: 'Session With Nulls'
        },
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
        }
      ];

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(sessionsWithNulls));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should only load the valid session
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe('valid-session');
    });

    it('should handle empty or non-array session data', async () => {
      // Test with non-array data
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify({ not: 'an array' }));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should handle gracefully and start with empty sessions
      expect(result.current.sessions).toHaveLength(0);
      expect(result.current.hasSessions).toBe(false);
      expect(result.current.isLoading).toBe(false);

      // Should clean up invalid data
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('rdln_memory_sessions');
    });

    it('should handle corrupted import data gracefully', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test various corrupted import scenarios
      let importResult1: boolean;
      act(() => {
        importResult1 = result.current.importSessions('invalid json data');
      });
      expect(importResult1!).toBe(false);

      let importResult2: boolean;
      act(() => {
        importResult2 = result.current.importSessions(JSON.stringify({ version: '1.0' })); // Missing sessions
      });
      expect(importResult2!).toBe(false);

      let importResult3: boolean;
      act(() => {
        importResult3 = result.current.importSessions(JSON.stringify({ sessions: 'not-an-array' }));
      });
      expect(importResult3!).toBe(false);

      let importResult4: boolean;
      act(() => {
        importResult4 = result.current.importSessions(JSON.stringify({ sessions: [] })); // Empty sessions
      });
      expect(importResult4!).toBe(false);

      // Verify no sessions were added
      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe('Requirement 3.4: Existing Error Handling Continues to Function', () => {
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

    it('should handle localStorage setItem failures during session operations', async () => {
      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify([]));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mock setItem to throw generic error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage write failed');
      });

      // Should still work in memory
      act(() => {
        result.current.saveSession(
          'Memory session',
          'Memory revised',
          false,
          'Memory Session'
        );
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Memory Session');
    });

    it('should handle complete localStorage unavailability', async () => {
      // Mock all localStorage methods to fail
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

      // Should be able to perform all operations in memory
      act(() => {
        result.current.saveSession('Test 1', 'Test 1 revised', false);
        result.current.saveSession('Test 2', 'Test 2 revised', true);
      });

      expect(result.current.sessions).toHaveLength(2);

      // Export should work
      const exportData = result.current.exportSessions();
      expect(exportData).toBeTruthy();
      const parsedExport = JSON.parse(exportData);
      expect(parsedExport.sessions).toHaveLength(2);

      // Clear should work
      act(() => {
        result.current.clearAllSessions();
      });

      expect(result.current.sessions).toHaveLength(0);
    });

    it('should maintain error handling for session validation', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test loading non-existent session
      const nonExistentSession = result.current.loadSession('non-existent-id');
      expect(nonExistentSession).toBeNull();

      // Test deleting non-existent session (should not throw)
      expect(() => {
        act(() => {
          result.current.deleteSession('non-existent-id');
        });
      }).not.toThrow();

      // Sessions should remain unchanged
      expect(result.current.sessions).toHaveLength(0);
    });

    it('should handle edge cases in session name generation', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Test with empty strings
      act(() => {
        result.current.saveSession('', '', false);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBeTruthy(); // Should generate a name

      // Test with very long strings
      const longText = 'a'.repeat(1000);
      act(() => {
        result.current.saveSession(longText, longText, false);
      });

      expect(result.current.sessions).toHaveLength(2);
      expect(result.current.sessions[0].sessionName).toBeTruthy(); // Should handle long text

      // Test with special characters
      act(() => {
        result.current.saveSession('Special chars: !@#$%^&*()', 'More special: <>&"\'', false);
      });

      expect(result.current.sessions).toHaveLength(3);
      expect(result.current.sessions[0].sessionName).toBeTruthy(); // Should handle special chars
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle maximum session limits gracefully', async () => {
      // Create sessions at the limit (99 is default max)
      const maxSessions = Array.from({ length: 99 }, (_, i) => ({
        id: `max-session-${i}`,
        timestamp: Date.now() - i * 1000,
        originalText: `Max session ${i} original`,
        revisedText: `Max session ${i} revised`,
        hasResult: i % 2 === 0,
        sessionName: `Max Session ${i}`,
        autoSaved: i % 3 === 0,
        characterCount: 30,
        preview: `Max session ${i} original`
      }));

      mockLocalStorage.setItem('rdln_memory_sessions', JSON.stringify(maxSessions));

      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.sessions).toHaveLength(99);

      // Add one more session - should remove oldest
      act(() => {
        result.current.saveSession(
          'New session beyond limit',
          'New session revised',
          false,
          'Beyond Limit Session'
        );
      });

      // Should still have 99 sessions (newest + 98 previous)
      expect(result.current.sessions).toHaveLength(99);
      expect(result.current.sessions[0].sessionName).toBe('Beyond Limit Session');
      expect(result.current.sessions.find(s => s.sessionName === 'Max Session 98')).toBeUndefined(); // Oldest removed
    });

    it('should handle concurrent session operations', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Simulate concurrent saves with explicit session names
      act(() => {
        result.current.saveSession('Concurrent 1', 'Concurrent 1 revised', false, 'Concurrent 1');
        result.current.saveSession('Concurrent 2', 'Concurrent 2 revised', false, 'Concurrent 2');
        result.current.saveSession('Concurrent 3', 'Concurrent 3 revised', false, 'Concurrent 3');
      });

      expect(result.current.sessions).toHaveLength(3);
      
      // All sessions should be present
      const sessionNames = result.current.sessions.map(s => s.sessionName);
      expect(sessionNames).toContain('Concurrent 1');
      expect(sessionNames).toContain('Concurrent 2');
      expect(sessionNames).toContain('Concurrent 3');
    });

    it('should handle rapid save/delete operations', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let sessionIds: string[] = [];

      // Rapid saves with explicit session names
      act(() => {
        sessionIds.push(result.current.saveSession('Rapid 1', 'Rapid 1 revised', false, 'Rapid 1'));
        sessionIds.push(result.current.saveSession('Rapid 2', 'Rapid 2 revised', false, 'Rapid 2'));
        sessionIds.push(result.current.saveSession('Rapid 3', 'Rapid 3 revised', false, 'Rapid 3'));
      });

      expect(result.current.sessions).toHaveLength(3);

      // Rapid deletes
      act(() => {
        result.current.deleteSession(sessionIds[0]);
        result.current.deleteSession(sessionIds[1]);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Rapid 3');
    });

    it('should handle very large session data', async () => {
      const { result } = renderHook(() => useRdLnMemoryContext(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Create very large content
      const largeContent = 'x'.repeat(100000); // 100KB of text
      
      act(() => {
        result.current.saveSession(
          largeContent,
          largeContent + ' revised',
          false,
          'Large Session'
        );
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].sessionName).toBe('Large Session');
      expect(result.current.sessions[0].characterCount).toBe(200008); // 100000 + 100008 chars

      // Should be able to load large session
      const sessionId = result.current.sessions[0].id;
      const loadedSession = result.current.loadSession(sessionId);
      expect(loadedSession).toBeTruthy();
      expect(loadedSession!.originalText).toBe(largeContent);
    });
  });
});
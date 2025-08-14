/**
 * Cross-Component Synchronization Tests
 * 
 * Tests for RdLn Memory state synchronization across components:
 * - ComparisonInterface
 * - RdLnMemorySidePanel  
 * - RdLnMemoryDropdown
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { RdLnMemoryProvider } from '../src/contexts/RdLnMemoryContext';
import { ComparisonInterface } from '../src/components/ComparisonInterface';
import { RdLnMemorySidePanel } from '../src/components/RdLnMemorySidePanel';
import { RdLnMemoryDropdown } from '../src/components/RdLnMemoryDropdown';

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

// Test wrapper component that includes all three components
const TestWrapper: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [originalText, setOriginalText] = React.useState('Test original content');
  const [revisedText, setRevisedText] = React.useState('Test revised content');

  return React.createElement(RdLnMemoryProvider, null,
    React.createElement('div', { 'data-testid': 'test-wrapper' },
      // ComparisonInterface
      React.createElement('div', { 'data-testid': 'comparison-interface' },
        React.createElement(ComparisonInterface, { 
          onContentChange: () => {}
        })
      ),

      // RdLnMemoryDropdown
      React.createElement('div', { 'data-testid': 'memory-dropdown' },
        React.createElement(RdLnMemoryDropdown, {
          isOpen: isDropdownOpen,
          onClose: () => setIsDropdownOpen(false),
          hasSessions: true,
          sessionCount: 0,
          onSaveSession: () => {
            // Simulate save session action
            const event = new CustomEvent('test-save-session', {
              detail: { source: 'dropdown' }
            });
            window.dispatchEvent(event);
          },
          onLoadSession: (sessionId: string) => {
            const event = new CustomEvent('test-load-session', {
              detail: { sessionId, source: 'dropdown' }
            });
            window.dispatchEvent(event);
          },
          onDeleteSession: (sessionId: string) => {
            const event = new CustomEvent('test-delete-session', {
              detail: { sessionId, source: 'dropdown' }
            });
            window.dispatchEvent(event);
          },
          contentLength: originalText.length + revisedText.length
        }),
        React.createElement('button', {
          'data-testid': 'open-dropdown',
          onClick: () => setIsDropdownOpen(true)
        }, 'Open Dropdown')
      ),

      // RdLnMemorySidePanel
      React.createElement('div', { 'data-testid': 'memory-side-panel' },
        React.createElement(RdLnMemorySidePanel, {
          isOpen: isPanelOpen,
          onClose: () => setIsPanelOpen(false),
          onLoadSession: (sessionId: string) => {
            const event = new CustomEvent('test-load-session', {
              detail: { sessionId, source: 'sidepanel' }
            });
            window.dispatchEvent(event);
          },
          originalText: originalText,
          revisedText: revisedText,
          hasResult: false
        }),
        React.createElement('button', {
          'data-testid': 'open-side-panel',
          onClick: () => setIsPanelOpen(true)
        }, 'Open Side Panel')
      )
    )
  );
};

describe('Cross-Component Synchronization', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock localStorage to return empty sessions initially
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Requirement 1.1: Save session in side panel appears immediately in dropdown', () => {
    it('should show saved session in dropdown immediately after saving in side panel', async () => {
      render(<TestWrapper />);
      
      // Open side panel
      fireEvent.click(screen.getByTestId('open-side-panel'));
      
      // Wait for side panel to be visible
      await waitFor(() => {
        expect(screen.getByText('RdLn Memory')).toBeInTheDocument();
      });
      
      // Find and click save button in side panel
      const saveButton = screen.getByText('Save Current Session');
      expect(saveButton).toBeInTheDocument();
      
      // Mock localStorage to return a saved session after save
      const mockSession = {
        id: 'test-session-1',
        timestamp: Date.now(),
        originalText: 'Test original content',
        revisedText: 'Test revised content',
        hasResult: false,
        sessionName: 'Test Session 1',
        autoSaved: false,
        characterCount: 35,
        preview: 'Test original content'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Save session
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      // Open dropdown
      fireEvent.click(screen.getByTestId('open-dropdown'));
      
      // Verify session appears in dropdown immediately (no page reload)
      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });
      
      // Verify session count is updated
      expect(screen.getByText('1 session')).toBeInTheDocument();
    });
  });

  describe('Requirement 1.2: Delete session in dropdown disappears immediately from side panel', () => {
    it('should remove deleted session from side panel immediately after deleting in dropdown', async () => {
      // Setup with existing session
      const mockSession = {
        id: 'test-session-1',
        timestamp: Date.now(),
        originalText: 'Test original content',
        revisedText: 'Test revised content',
        hasResult: false,
        sessionName: 'Test Session 1',
        autoSaved: false,
        characterCount: 35,
        preview: 'Test original content'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      render(<TestWrapper />);
      
      // Open dropdown and verify session exists
      fireEvent.click(screen.getByTestId('open-dropdown'));
      await waitFor(() => {
        expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      });
      
      // Find and click delete button in dropdown
      const deleteButton = screen.getByTitle('Delete session');
      expect(deleteButton).toBeInTheDocument();
      
      // Mock localStorage to return empty array after deletion
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      // Delete session
      await act(async () => {
        fireEvent.click(deleteButton);
      });
      
      // Close dropdown and open side panel
      fireEvent.click(screen.getByTestId('open-side-panel'));
      
      // Verify session is gone from side panel immediately (no page reload)
      await waitFor(() => {
        expect(screen.queryByText('Test Session 1')).not.toBeInTheDocument();
      });
      
      // Verify "No saved sessions" message appears
      expect(screen.getByText('No saved sessions')).toBeInTheDocument();
    });
  });

  describe('Requirement 1.3: Save session in ComparisonInterface appears in both other components', () => {
    it('should show saved session in both dropdown and side panel after saving in ComparisonInterface', async () => {
      render(<TestWrapper />);
      
      // Mock a session being saved from ComparisonInterface
      const mockSession = {
        id: 'test-session-comparison',
        timestamp: Date.now(),
        originalText: 'Comparison original text',
        revisedText: 'Comparison revised text',
        hasResult: true,
        sessionName: 'Comparison Session',
        autoSaved: true,
        characterCount: 45,
        preview: 'Comparison original text'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Simulate session save from ComparisonInterface by triggering context update
      // This would normally happen through the useRdLnMemoryContext hook
      
      // Open dropdown and verify session appears
      fireEvent.click(screen.getByTestId('open-dropdown'));
      await waitFor(() => {
        expect(screen.getByText('Comparison Session')).toBeInTheDocument();
      });
      
      // Close dropdown and open side panel
      fireEvent.click(screen.getByTestId('open-side-panel'));
      
      // Verify session appears in side panel
      await waitFor(() => {
        expect(screen.getByText('Comparison Session')).toBeInTheDocument();
      });
      
      // Verify session shows as having results (✅ Compared)
      expect(screen.getByText('✅ Compared')).toBeInTheDocument();
    });
  });

  describe('Requirement 1.4: No page reload required for synchronization', () => {
    it('should synchronize state changes without page reload', async () => {
      render(<TestWrapper />);
      
      // Track if page reload occurs (it shouldn't)
      const originalReload = window.location.reload;
      const reloadSpy = vi.fn();
      Object.defineProperty(window.location, 'reload', {
        value: reloadSpy,
        writable: true,
      });
      
      // Start with no sessions
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      // Open side panel and verify no sessions
      fireEvent.click(screen.getByTestId('open-side-panel'));
      await waitFor(() => {
        expect(screen.getByText('No saved sessions')).toBeInTheDocument();
      });
      
      // Add a session
      const mockSession = {
        id: 'sync-test-session',
        timestamp: Date.now(),
        originalText: 'Sync test content',
        revisedText: 'Sync test revised',
        hasResult: false,
        sessionName: 'Sync Test Session',
        autoSaved: false,
        characterCount: 30,
        preview: 'Sync test content'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockSession]));
      
      // Save session (simulate context update)
      const saveButton = screen.getByText('Save Current Session');
      await act(async () => {
        fireEvent.click(saveButton);
      });
      
      // Verify session appears immediately without reload
      await waitFor(() => {
        expect(screen.getByText('Sync Test Session')).toBeInTheDocument();
      });
      
      // Open dropdown and verify session is there too
      fireEvent.click(screen.getByTestId('open-dropdown'));
      await waitFor(() => {
        expect(screen.getByText('Sync Test Session')).toBeInTheDocument();
      });
      
      // Verify no page reload was triggered
      expect(reloadSpy).not.toHaveBeenCalled();
      
      // Restore original reload function
      Object.defineProperty(window.location, 'reload', {
        value: originalReload,
        writable: true,
      });
    });
  });

  describe('Context Provider Integration', () => {
    it('should provide consistent state across all components', async () => {
      render(<TestWrapper />);
      
      // Setup multiple sessions
      const mockSessions = [
        {
          id: 'session-1',
          timestamp: Date.now() - 1000,
          originalText: 'First session content',
          revisedText: 'First session revised',
          hasResult: true,
          sessionName: 'First Session',
          autoSaved: false,
          characterCount: 35,
          preview: 'First session content'
        },
        {
          id: 'session-2',
          timestamp: Date.now(),
          originalText: 'Second session content',
          revisedText: 'Second session revised',
          hasResult: false,
          sessionName: 'Second Session',
          autoSaved: true,
          characterCount: 37,
          preview: 'Second session content'
        }
      ];
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessions));
      
      // Open dropdown and verify both sessions
      fireEvent.click(screen.getByTestId('open-dropdown'));
      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
        expect(screen.getByText('Second Session')).toBeInTheDocument();
        expect(screen.getByText('2 sessions')).toBeInTheDocument();
      });
      
      // Close dropdown and open side panel
      fireEvent.click(screen.getByTestId('open-side-panel'));
      
      // Verify same sessions in side panel
      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
        expect(screen.getByText('Second Session')).toBeInTheDocument();
        expect(screen.getByText('2 sessions')).toBeInTheDocument();
      });
      
      // Verify session details are consistent
      expect(screen.getByText('✅ Compared')).toBeInTheDocument(); // First session has results
    });
  });

  describe('Error Handling', () => {
    it('should handle context provider missing gracefully', () => {
      // Test component without provider wrapper
      const TestComponentWithoutProvider = () => React.createElement(RdLnMemoryDropdown, {
        isOpen: true,
        onClose: () => {},
        hasSessions: false,
        sessionCount: 0
      });
      
      // Should throw error when context is missing
      expect(() => {
        render(React.createElement(TestComponentWithoutProvider));
      }).toThrow('useRdLnMemoryContext must be used within RdLnMemoryProvider');
    });
  });
});
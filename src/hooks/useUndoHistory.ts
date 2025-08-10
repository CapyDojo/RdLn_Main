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

import { useState, useCallback, useEffect, useRef } from 'react';

interface ClearUndoState {
  originalText: string;
  revisedText: string;
  timestamp: number;
}

interface UndoHistoryOptions {
  storageKey?: string;
  autoSave?: boolean;
}

interface UndoHistoryReturn {
  // State
  canUndo: boolean;
  
  // Actions
  saveClearState: (originalText: string, revisedText: string) => void;
  undoClear: () => ClearUndoState | null;
  clearUndoState: () => void;
}

/**
 * useUndoHistory Hook
 * 
 * Provides simple undo functionality to protect against accidental clears.
 * Only stores the last cleared state for easy restoration.
 */
export const useUndoHistory = (options: UndoHistoryOptions = {}): UndoHistoryReturn => {
  const {
    storageKey = 'rdln_clear_undo',
    autoSave = true
  } = options;

  const [clearedState, setClearedState] = useState<ClearUndoState | null>(null);
  const isInitializedRef = useRef(false);

  // Load cleared state from localStorage on initialization
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedState: ClearUndoState = JSON.parse(stored);
        
        // Validate stored data
        if (parsedState && 
            typeof parsedState.originalText === 'string' &&
            typeof parsedState.revisedText === 'string' &&
            typeof parsedState.timestamp === 'number') {
          setClearedState(parsedState);
        }
      }
    } catch (error) {
      console.warn('Failed to load clear undo state from localStorage:', error);
      localStorage.removeItem(storageKey);
    }
    
    isInitializedRef.current = true;
  }, [storageKey]);

  // Save cleared state to localStorage whenever it changes
  useEffect(() => {
    if (!isInitializedRef.current || !autoSave) return;

    try {
      if (clearedState) {
        localStorage.setItem(storageKey, JSON.stringify(clearedState));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.warn('Failed to save clear undo state to localStorage:', error);
    }
  }, [clearedState, storageKey, autoSave]);

  // Save state before clearing (only called before clear operations)
  const saveClearState = useCallback((originalText: string, revisedText: string) => {
    const newState: ClearUndoState = {
      originalText: originalText || '',
      revisedText: revisedText || '',
      timestamp: Date.now()
    };
    
    setClearedState(newState);
    console.log('💾 Clear state saved for undo protection:', {
      originalLength: newState.originalText.length,
      revisedLength: newState.revisedText.length
    });
  }, []);

  // Restore the cleared content
  const undoClear = useCallback((): ClearUndoState | null => {
    if (!clearedState) {
      console.log('❌ Cannot undo clear - no saved state');
      return null;
    }

    console.log('🔄 Restoring cleared content:', {
      originalLength: clearedState.originalText.length,
      revisedLength: clearedState.revisedText.length
    });

    // Clear the saved state after using it (single use)
    setClearedState(null);
    
    return clearedState;
  }, [clearedState]);

  // Clear the undo state (called when new content is entered)
  const clearUndoState = useCallback(() => {
    setClearedState(null);
  }, []);

  // Computed state
  const canUndo = clearedState !== null;

  return {
    // State
    canUndo,
    
    // Actions
    saveClearState,
    undoClear,
    clearUndoState
  };
};
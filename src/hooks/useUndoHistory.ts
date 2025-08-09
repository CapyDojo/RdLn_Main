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

interface UndoState {
  id: string;
  timestamp: number;
  originalText: string;
  revisedText: string;
  hasResult: boolean;
  action: string; // Description of the action (e.g., "Clear", "Paste", "Load Sample")
}

interface UndoHistoryOptions {
  maxHistorySize?: number;
  storageKey?: string;
  autoSave?: boolean;
}

interface UndoHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  currentState: UndoState | null;
  historySize: number;
  
  // Actions
  saveState: (originalText: string, revisedText: string, hasResult: boolean, action: string) => void;
  undo: () => UndoState | null;
  redo: () => UndoState | null;
  clearHistory: () => void;
  getLastAction: () => string | null;
}

/**
 * useUndoHistory Hook
 * 
 * Provides persistent undo/redo functionality with localStorage storage.
 * Designed for lightning-fast UX without confirmation dialogs.
 */
export const useUndoHistory = (options: UndoHistoryOptions = {}): UndoHistoryReturn => {
  const {
    maxHistorySize = 50,
    storageKey = 'rdln_undo_history',
    autoSave = true
  } = options;

  const [history, setHistory] = useState<UndoState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isInitializedRef = useRef(false);

  // Load history from localStorage on initialization
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedHistory: UndoState[] = JSON.parse(stored);
        
        // Validate and clean stored data
        const validHistory = parsedHistory.filter((state): state is UndoState => 
          state && 
          typeof state.id === 'string' &&
          typeof state.timestamp === 'number' &&
          typeof state.originalText === 'string' &&
          typeof state.revisedText === 'string' &&
          typeof state.hasResult === 'boolean' &&
          typeof state.action === 'string'
        );

        if (validHistory.length > 0) {
          setHistory(validHistory);
          setCurrentIndex(validHistory.length - 1);
        }
      }
    } catch (error) {
      console.warn('Failed to load undo history from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
    }
    
    isInitializedRef.current = true;
  }, [storageKey]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!isInitializedRef.current || !autoSave) return;

    try {
      // Only store recent history to prevent localStorage overflow
      const historyToStore = history.slice(-maxHistorySize);
      localStorage.setItem(storageKey, JSON.stringify(historyToStore));
    } catch (error) {
      console.warn('Failed to save undo history to localStorage:', error);
      // Try to clear some space by removing old entries
      try {
        const reducedHistory = history.slice(-Math.floor(maxHistorySize / 2));
        localStorage.setItem(storageKey, JSON.stringify(reducedHistory));
        setHistory(reducedHistory);
        setCurrentIndex(Math.min(currentIndex, reducedHistory.length - 1));
      } catch (retryError) {
        console.error('Failed to save reduced undo history:', retryError);
      }
    }
  }, [history, maxHistorySize, storageKey, autoSave, currentIndex]);

  // Save a new state to history
  const saveState = useCallback((
    originalText: string, 
    revisedText: string, 
    hasResult: boolean, 
    action: string
  ) => {
    const newState: UndoState = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      originalText: originalText || '',
      revisedText: revisedText || '',
      hasResult,
      action
    };

    setHistory(prev => {
      // Remove any states after current index (if we're in the middle of history)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      const limitedHistory = newHistory.slice(-maxHistorySize);
      
      return limitedHistory;
    });

    setCurrentIndex(prev => {
      const newHistory = history.slice(0, prev + 1);
      newHistory.push(newState);
      const limitedHistory = newHistory.slice(-maxHistorySize);
      return limitedHistory.length - 1;
    });
  }, [currentIndex, maxHistorySize, history]);

  // Undo to previous state
  const undo = useCallback((): UndoState | null => {
    if (currentIndex <= 0) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[newIndex] || null;
  }, [currentIndex, history]);

  // Redo to next state
  const redo = useCallback((): UndoState | null => {
    if (currentIndex >= history.length - 1) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return history[newIndex] || null;
  }, [currentIndex, history]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    
    if (autoSave) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear undo history from localStorage:', error);
      }
    }
  }, [autoSave, storageKey]);

  // Get the last action description
  const getLastAction = useCallback((): string | null => {
    if (currentIndex >= 0 && history[currentIndex]) {
      return history[currentIndex].action;
    }
    return null;
  }, [currentIndex, history]);

  // Computed state
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentState = currentIndex >= 0 ? history[currentIndex] : null;
  const historySize = history.length;

  return {
    // State
    canUndo,
    canRedo,
    currentState,
    historySize,
    
    // Actions
    saveState,
    undo,
    redo,
    clearHistory,
    getLastAction
  };
};
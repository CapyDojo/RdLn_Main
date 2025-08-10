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

interface RdLnSession {
  id: string;
  timestamp: number;
  originalText: string;
  revisedText: string;
  hasResult: boolean;
  sessionName?: string;
  autoSaved: boolean;
  characterCount: number;
  preview: string; // First 50 chars for quick identification
}

interface RdLnMemoryOptions {
  maxSessions?: number;
  storageKey?: string;
  autoSave?: boolean;
  previewLength?: number;
}

interface RdLnMemoryReturn {
  // State
  sessions: RdLnSession[];
  hasSessions: boolean;
  isLoading: boolean;
  
  // Actions
  saveSession: (originalText: string, revisedText: string, hasResult: boolean, sessionName?: string) => void;
  loadSession: (sessionId: string) => RdLnSession | null;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  generateSessionName: (originalText: string, revisedText: string) => string;
  exportSessions: () => string;
  importSessions: (jsonData: string) => boolean;
}

/**
 * useRdLnMemory Hook
 * 
 * Provides comprehensive session management for document comparisons.
 * Allows users to save, load, and manage multiple comparison sessions.
 */
export const useRdLnMemory = (options: RdLnMemoryOptions = {}): RdLnMemoryReturn => {
  const {
    maxSessions = 50,
    storageKey = 'rdln_memory_sessions',
    autoSave = true,
    previewLength = 50
  } = options;

  const [sessions, setSessions] = useState<RdLnSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // Load sessions from localStorage on initialization
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const loadSessions = async () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsedSessions: RdLnSession[] = JSON.parse(stored);
          
          // Validate and clean stored data
          const validSessions = parsedSessions.filter((session): session is RdLnSession => 
            session && 
            typeof session.id === 'string' &&
            typeof session.timestamp === 'number' &&
            typeof session.originalText === 'string' &&
            typeof session.revisedText === 'string' &&
            typeof session.hasResult === 'boolean' &&
            typeof session.autoSaved === 'boolean' &&
            typeof session.characterCount === 'number' &&
            typeof session.preview === 'string'
          );

          // Sort by timestamp (newest first)
          const sortedSessions = validSessions.sort((a, b) => b.timestamp - a.timestamp);
          setSessions(sortedSessions);
          
          console.log(`📚 RdLn Memory: Loaded ${sortedSessions.length} sessions from storage`);
        }
      } catch (error) {
        console.warn('Failed to load RdLn Memory sessions from localStorage:', error);
        localStorage.removeItem(storageKey);
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    loadSessions();
  }, [storageKey]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (!isInitializedRef.current || !autoSave || isLoading) return;

    try {
      // Only store recent sessions to prevent localStorage overflow
      const sessionsToStore = sessions.slice(0, maxSessions);
      localStorage.setItem(storageKey, JSON.stringify(sessionsToStore));
      
      console.log(`💾 RdLn Memory: Saved ${sessionsToStore.length} sessions to storage`);
    } catch (error) {
      console.warn('Failed to save RdLn Memory sessions to localStorage:', error);
      
      // Try to save reduced sessions if quota exceeded
      try {
        const reducedSessions = sessions.slice(0, Math.floor(maxSessions / 2));
        localStorage.setItem(storageKey, JSON.stringify(reducedSessions));
        setSessions(reducedSessions);
        console.log(`💾 RdLn Memory: Saved reduced sessions (${reducedSessions.length}) due to storage limit`);
      } catch (retryError) {
        console.error('Failed to save reduced RdLn Memory sessions:', retryError);
      }
    }
  }, [sessions, maxSessions, storageKey, autoSave, isLoading]);

  // Generate a smart session name based on content
  const generateSessionName = useCallback((originalText: string, revisedText: string): string => {
    const now = new Date();
    const timeStr = now.toLocaleString();
    
    // Try to extract meaningful content for naming
    const originalPreview = originalText.trim().slice(0, 20);
    const revisedPreview = revisedText.trim().slice(0, 20);
    
    if (originalPreview && revisedPreview) {
      return `${originalPreview} vs ${revisedPreview}`;
    } else if (originalPreview) {
      return `${originalPreview} (comparison)`;
    } else if (revisedPreview) {
      return `New comparison with ${revisedPreview}`;
    } else {
      return `Comparison ${timeStr}`;
    }
  }, []);

  // Create preview text for quick identification
  const createPreview = useCallback((originalText: string, revisedText: string): string => {
    const original = originalText.trim();
    const revised = revisedText.trim();
    
    if (original && revised) {
      return `${original.slice(0, previewLength / 2)}... vs ${revised.slice(0, previewLength / 2)}...`;
    } else if (original) {
      return original.slice(0, previewLength) + (original.length > previewLength ? '...' : '');
    } else if (revised) {
      return revised.slice(0, previewLength) + (revised.length > previewLength ? '...' : '');
    }
    return '(Empty comparison)';
  }, [previewLength]);

  // Save a new session
  const saveSession = useCallback((
    originalText: string, 
    revisedText: string, 
    hasResult: boolean, 
    sessionName?: string
  ) => {
    const newSession: RdLnSession = {
      id: `rdln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      originalText: originalText || '',
      revisedText: revisedText || '',
      hasResult,
      sessionName: sessionName || generateSessionName(originalText, revisedText),
      autoSaved: !sessionName, // If no name provided, it's auto-saved
      characterCount: (originalText?.length || 0) + (revisedText?.length || 0),
      preview: createPreview(originalText, revisedText)
    };
    
    setSessions(prevSessions => {
      // Add to beginning of array (newest first)
      const updatedSessions = [newSession, ...prevSessions];
      
      // Limit total sessions
      const limitedSessions = updatedSessions.slice(0, maxSessions);
      
      console.log(`💾 RdLn Memory: Session saved "${newSession.sessionName}" (${newSession.characterCount} chars)`);
      
      return limitedSessions;
    });
    
    return newSession.id;
  }, [generateSessionName, createPreview, maxSessions]);

  // Load a session by ID
  const loadSession = useCallback((sessionId: string): RdLnSession | null => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      console.log(`📖 RdLn Memory: Loading session "${session.sessionName}"`);
      return session;
    }
    
    console.warn(`❌ RdLn Memory: Session not found: ${sessionId}`);
    return null;
  }, [sessions]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prevSessions => {
      const sessionToDelete = prevSessions.find(s => s.id === sessionId);
      const updatedSessions = prevSessions.filter(s => s.id !== sessionId);
      
      if (sessionToDelete) {
        console.log(`🗑️ RdLn Memory: Deleted session "${sessionToDelete.sessionName}"`);
      }
      
      return updatedSessions;
    });
  }, []);

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    console.log('🧹 RdLn Memory: All sessions cleared');
  }, []);

  // Export sessions as JSON
  const exportSessions = useCallback((): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      sessions: sessions
    };
    
    console.log(`📤 RdLn Memory: Exported ${sessions.length} sessions`);
    return JSON.stringify(exportData, null, 2);
  }, [sessions]);

  // Import sessions from JSON
  const importSessions = useCallback((jsonData: string): boolean => {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.sessions || !Array.isArray(importData.sessions)) {
        console.error('❌ RdLn Memory: Invalid import data format');
        return false;
      }
      
      // Validate imported sessions
      const validSessions = importData.sessions.filter((session: any): session is RdLnSession => 
        session && 
        typeof session.id === 'string' &&
        typeof session.originalText === 'string' &&
        typeof session.revisedText === 'string'
      );
      
      if (validSessions.length === 0) {
        console.error('❌ RdLn Memory: No valid sessions found in import data');
        return false;
      }
      
      // Merge with existing sessions, avoiding duplicates
      setSessions(prevSessions => {
        const existingIds = new Set(prevSessions.map(s => s.id));
        const newSessions = validSessions.filter(s => !existingIds.has(s.id));
        
        const mergedSessions = [...newSessions, ...prevSessions];
        const sortedSessions = mergedSessions
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxSessions);
        
        console.log(`📥 RdLn Memory: Imported ${newSessions.length} new sessions`);
        return sortedSessions;
      });
      
      return true;
    } catch (error) {
      console.error('❌ RdLn Memory: Failed to import sessions:', error);
      return false;
    }
  }, [maxSessions]);

  // Computed state
  const hasSessions = sessions.length > 0;

  return {
    // State
    sessions,
    hasSessions,
    isLoading,
    
    // Actions
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    generateSessionName,
    exportSessions,
    importSessions
  };
};
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

interface ExportMetadata {
  lastExportTimestamp?: number;
  exportedSessionIds: string[];
  totalExports: number;
}

interface StorageQuotaInfo {
  usagePercentage: number;
  totalSessions: number;
  shouldShowWarning: boolean;
  warningLevel: '75%' | '85%' | '95%' | null;
  newSessionsSinceExport: number;
  lastExportDate?: Date;
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
  storageQuotaInfo: StorageQuotaInfo;
  
  // Actions
  saveSession: (originalText: string, revisedText: string, hasResult: boolean, sessionName?: string) => void;
  loadSession: (sessionId: string) => RdLnSession | null;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  generateSessionName: (originalText: string, revisedText: string) => string;
  exportSessions: (type?: 'full' | 'incremental' | 'dateRange' | 'selected', options?: any) => string;
  importSessions: (jsonData: string) => boolean;
  autoCleanOldSessions: (olderThanDays: number) => number;
  exportAndClean: (exportType: 'full' | 'incremental' | 'none', cleanupPercentage: number) => { exportData?: string; cleanedCount: number };
  dismissQuotaWarning: (remindAt?: '75%' | '85%' | '95%') => void;
}

/**
 * useRdLnMemory Hook
 * 
 * Provides comprehensive session management for document comparisons.
 * Allows users to save, load, and manage multiple comparison sessions.
 */
export const useRdLnMemory = (options: RdLnMemoryOptions = {}): RdLnMemoryReturn => {
  const {
    maxSessions = 99,
    storageKey = 'rdln_memory_sessions',
    autoSave = true,
    previewLength = 50
  } = options;

  const [sessions, setSessions] = useState<RdLnSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageQuotaInfo, setStorageQuotaInfo] = useState<StorageQuotaInfo>({
    usagePercentage: 0,
    totalSessions: 0,
    shouldShowWarning: false,
    warningLevel: null,
    newSessionsSinceExport: 0,
  });
  const isInitializedRef = useRef(false);
  
  // Storage keys for metadata
  const exportMetadataKey = `${storageKey}_export_metadata`;
  const quotaWarningKey = `${storageKey}_quota_warnings`;

  // Calculate storage quota usage
  const calculateStorageQuota = useCallback((currentSessions: RdLnSession[]): StorageQuotaInfo => {
    try {
      // Estimate localStorage usage
      const sessionsData = JSON.stringify(currentSessions);
      const sessionsSizeKB = new Blob([sessionsData]).size / 1024;
      
      // Estimate total localStorage usage (sessions + other app data)
      let totalSizeKB = sessionsSizeKB;
      try {
        // Add size of other localStorage items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key !== storageKey) {
            const value = localStorage.getItem(key) || '';
            totalSizeKB += new Blob([value]).size / 1024;
          }
        }
      } catch (error) {
        console.warn('Could not calculate total localStorage usage:', error);
      }
      
      // Estimate localStorage quota (typically 5-10MB, we'll use 5MB as conservative estimate)
      const quotaKB = 5 * 1024; // 5MB in KB
      const usagePercentage = Math.min(Math.round((totalSizeKB / quotaKB) * 100), 100);
      
      // Get export metadata
      const exportMetadata: ExportMetadata = JSON.parse(
        localStorage.getItem(exportMetadataKey) || '{"exportedSessionIds": [], "totalExports": 0}'
      );
      
      // Calculate new sessions since last export
      const newSessionsSinceExport = currentSessions.filter(
        session => !exportMetadata.exportedSessionIds.includes(session.id)
      ).length;
      
      // Get dismissed warning levels
      const dismissedWarnings = JSON.parse(
        localStorage.getItem(quotaWarningKey) || '{}'
      );
      
      // Determine warning level and if we should show warning
      let warningLevel: '75%' | '85%' | '95%' | null = null;
      let shouldShowWarning = false;
      
      if (usagePercentage >= 95) {
        warningLevel = '95%';
        shouldShowWarning = !dismissedWarnings['95%'] || dismissedWarnings['95%'] < Date.now();
      } else if (usagePercentage >= 85) {
        warningLevel = '85%';
        shouldShowWarning = !dismissedWarnings['85%'] || dismissedWarnings['85%'] < Date.now();
      } else if (usagePercentage >= 75) {
        warningLevel = '75%';
        shouldShowWarning = !dismissedWarnings['75%'] || dismissedWarnings['75%'] < Date.now();
      }
      
      return {
        usagePercentage,
        totalSessions: currentSessions.length,
        shouldShowWarning,
        warningLevel,
        newSessionsSinceExport,
        lastExportDate: exportMetadata.lastExportTimestamp ? new Date(exportMetadata.lastExportTimestamp) : undefined,
      };
    } catch (error) {
      console.warn('Error calculating storage quota:', error);
      return {
        usagePercentage: 0,
        totalSessions: currentSessions.length,
        shouldShowWarning: false,
        warningLevel: null,
        newSessionsSinceExport: 0,
      };
    }
  }, [storageKey, exportMetadataKey, quotaWarningKey]);

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
          
          // Calculate storage quota info
          const quotaInfo = calculateStorageQuota(sortedSessions);
          setStorageQuotaInfo(quotaInfo);
          
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
      
      // Update storage quota info
      const quotaInfo = calculateStorageQuota(sessionsToStore);
      setStorageQuotaInfo(quotaInfo);
      
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

  // Enhanced export sessions with different options
  const exportSessions = useCallback((
    type: 'full' | 'incremental' | 'dateRange' | 'selected' = 'full',
    options?: {
      startDate?: Date;
      endDate?: Date;
      selectedIds?: string[];
    }
  ): string => {
    let sessionsToExport: RdLnSession[] = [];
    let exportType = type;
    
    // Get export metadata
    const exportMetadata: ExportMetadata = JSON.parse(
      localStorage.getItem(exportMetadataKey) || '{"exportedSessionIds": [], "totalExports": 0}'
    );
    
    switch (type) {
      case 'full':
        sessionsToExport = sessions;
        break;
        
      case 'incremental':
        sessionsToExport = sessions.filter(
          session => !exportMetadata.exportedSessionIds.includes(session.id)
        );
        break;
        
      case 'dateRange':
        if (options?.startDate && options?.endDate) {
          sessionsToExport = sessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            return sessionDate >= options.startDate! && sessionDate <= options.endDate!;
          });
        } else {
          sessionsToExport = sessions;
          exportType = 'full';
        }
        break;
        
      case 'selected':
        if (options?.selectedIds?.length) {
          sessionsToExport = sessions.filter(session => 
            options.selectedIds!.includes(session.id)
          );
        } else {
          sessionsToExport = sessions;
          exportType = 'full';
        }
        break;
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const exportData = {
      exportDate: now.toISOString(),
      exportType,
      version: '1.0',
      totalSessions: sessions.length,
      exportedSessions: sessionsToExport.length,
      sessions: sessionsToExport,
      metadata: {
        previousExports: exportMetadata.totalExports,
        lastExportDate: exportMetadata.lastExportTimestamp ? new Date(exportMetadata.lastExportTimestamp).toISOString() : null,
      }
    };
    
    // Update export metadata
    const updatedMetadata: ExportMetadata = {
      lastExportTimestamp: now.getTime(),
      exportedSessionIds: [
        ...new Set([
          ...exportMetadata.exportedSessionIds,
          ...sessionsToExport.map(s => s.id)
        ])
      ],
      totalExports: exportMetadata.totalExports + 1,
    };
    
    try {
      localStorage.setItem(exportMetadataKey, JSON.stringify(updatedMetadata));
    } catch (error) {
      console.warn('Failed to update export metadata:', error);
    }
    
    // Update storage quota info after export
    const quotaInfo = calculateStorageQuota(sessions);
    setStorageQuotaInfo(quotaInfo);
    
    console.log(`📤 RdLn Memory: Exported ${sessionsToExport.length} sessions (${exportType})`);
    return JSON.stringify(exportData, null, 2);
  }, [sessions, exportMetadataKey, calculateStorageQuota]);

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

  // Auto-clean old sessions
  const autoCleanOldSessions = useCallback((olderThanDays: number): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffTimestamp = cutoffDate.getTime();
    
    setSessions(prevSessions => {
      const sessionsToKeep = prevSessions.filter(session => session.timestamp > cutoffTimestamp);
      const cleanedCount = prevSessions.length - sessionsToKeep.length;
      
      console.log(`🧹 RdLn Memory: Auto-cleaned ${cleanedCount} sessions older than ${olderThanDays} days`);
      return sessionsToKeep;
    });
    
    // Return count of cleaned sessions (will be calculated in the effect)
    const sessionsToKeep = sessions.filter(session => session.timestamp > cutoffTimestamp);
    return sessions.length - sessionsToKeep.length;
  }, [sessions]);

  // Export and clean combined operation
  const exportAndClean = useCallback((
    exportType: 'full' | 'incremental' | 'none',
    cleanupPercentage: number
  ): { exportData?: string; cleanedCount: number } => {
    let exportData: string | undefined;
    
    // Export first if requested
    if (exportType !== 'none') {
      exportData = exportSessions(exportType);
    }
    
    // Then clean up sessions
    const sessionsToRemove = Math.floor(sessions.length * (cleanupPercentage / 100));
    
    setSessions(prevSessions => {
      // Sort by timestamp and remove oldest sessions
      const sortedSessions = [...prevSessions].sort((a, b) => b.timestamp - a.timestamp);
      const sessionsToKeep = sortedSessions.slice(0, sortedSessions.length - sessionsToRemove);
      
      console.log(`🧹 RdLn Memory: Cleaned up ${sessionsToRemove} oldest sessions (${cleanupPercentage}%)`);
      return sessionsToKeep;
    });
    
    return {
      exportData,
      cleanedCount: sessionsToRemove,
    };
  }, [sessions, exportSessions]);

  // Dismiss quota warning
  const dismissQuotaWarning = useCallback((remindAt?: '75%' | '85%' | '95%') => {
    try {
      const dismissedWarnings = JSON.parse(
        localStorage.getItem(quotaWarningKey) || '{}'
      );
      
      if (remindAt) {
        // Set reminder for next threshold
        const remindAtPercentages = { '75%': 75, '85%': 85, '95%': 95 };
        const currentPercentage = storageQuotaInfo.usagePercentage;
        const targetPercentage = remindAtPercentages[remindAt];
        
        if (currentPercentage < targetPercentage) {
          // Clear current dismissal so warning shows at target percentage
          delete dismissedWarnings[storageQuotaInfo.warningLevel || ''];
        }
      } else {
        // Dismiss current warning level indefinitely
        if (storageQuotaInfo.warningLevel) {
          dismissedWarnings[storageQuotaInfo.warningLevel] = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        }
      }
      
      localStorage.setItem(quotaWarningKey, JSON.stringify(dismissedWarnings));
      
      // Update storage quota info
      const quotaInfo = calculateStorageQuota(sessions);
      setStorageQuotaInfo(quotaInfo);
      
      console.log(`🔕 RdLn Memory: Dismissed quota warning${remindAt ? ` until ${remindAt}` : ''}`);
    } catch (error) {
      console.warn('Failed to dismiss quota warning:', error);
    }
  }, [quotaWarningKey, storageQuotaInfo, calculateStorageQuota, sessions]);

  // Computed state
  const hasSessions = sessions.length > 0;

  return {
    // State
    sessions,
    hasSessions,
    isLoading,
    storageQuotaInfo,
    
    // Actions
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    generateSessionName,
    exportSessions,
    importSessions,
    autoCleanOldSessions,
    exportAndClean,
    dismissQuotaWarning,
  };
};
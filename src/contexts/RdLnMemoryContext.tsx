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
 * 
 * RdLnMemoryContext - Centralized session state management
 * 
 * This context provider solves the synchronization issue where multiple components
 * using separate instances of useRdLnMemory would not see each other's session
 * changes until page reload. Now all components share a single session state.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useRdLnMemory } from '../hooks/useRdLnMemory';

/**
 * RdLn Session interface for document comparison sessions
 */
interface RdLnSession {
  id: string;
  timestamp: number;
  originalText: string;
  revisedText: string;
  hasResult: boolean;
  sessionName?: string;
  autoSaved: boolean;
  characterCount: number;
  preview: string;
}

/**
 * Storage quota information interface
 */
interface StorageQuotaInfo {
  usagePercentage: number;
  totalSessions: number;
  shouldShowWarning: boolean;
  warningLevel: '75%' | '85%' | '95%' | null;
  newSessionsSinceExport: number;
  lastExportDate?: Date;
}

/**
 * Export options interface for different export types
 */
interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  sessionIds?: string[];
  includeMetadata?: boolean;
}

/**
 * Context type for RdLn Memory management
 * Provides shared state for session management across all components
 */
interface RdLnMemoryContextType {
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
  exportSessions: (type?: 'full' | 'incremental' | 'dateRange' | 'selected', options?: ExportOptions) => string;
  importSessions: (jsonData: string) => boolean;
  autoCleanOldSessions: (olderThanDays: number) => number;
  exportAndClean: (exportType: 'full' | 'incremental' | 'none', cleanupPercentage: number) => { exportData?: string; cleanedCount: number };
  dismissQuotaWarning: (remindAt?: '75%' | '85%' | '95%') => void;
}

/**
 * React Context for RdLn Memory management
 */
const RdLnMemoryContext = createContext<RdLnMemoryContextType | undefined>(undefined);

/**
 * Props interface for RdLnMemoryProvider
 */
interface RdLnMemoryProviderProps {
  children: ReactNode;
}

/**
 * RdLnMemoryProvider Component
 * 
 * Provides a single shared instance of RdLn Memory state across the application.
 * Wraps the existing useRdLnMemory hook to create centralized session management.
 * 
 * This solves the synchronization issue where multiple components using separate
 * instances of useRdLnMemory would not see each other's session changes until
 * page reload.
 * 
 * @param children - Child components that will have access to the RdLn Memory context
 */
export const RdLnMemoryProvider: React.FC<RdLnMemoryProviderProps> = ({ children }) => {
  // Single instance of the useRdLnMemory hook that will be shared across all components
  const rdlnMemory = useRdLnMemory();

  return (
    <RdLnMemoryContext.Provider value={rdlnMemory}>
      {children}
    </RdLnMemoryContext.Provider>
  );
};

/**
 * useRdLnMemoryContext Hook
 * 
 * Custom hook to access the RdLn Memory context.
 * Provides the same interface as useRdLnMemory but ensures all components
 * share the same session state.
 * 
 * @throws {Error} When used outside of RdLnMemoryProvider
 * @returns {RdLnMemoryContextType} The RdLn Memory context value with session state and actions
 * 
 * @example
 * ```tsx
 * const { sessions, saveSession, deleteSession } = useRdLnMemoryContext();
 * ```
 */
export const useRdLnMemoryContext = (): RdLnMemoryContextType => {
  const context = useContext(RdLnMemoryContext);
  
  if (context === undefined) {
    throw new Error(
      'useRdLnMemoryContext must be used within a RdLnMemoryProvider. ' +
      'Make sure to wrap your component tree with <RdLnMemoryProvider>.'
    );
  }
  
  return context;
};

// Export the RdLnSession type for use in other components
export type { RdLnSession };
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

import React, { useEffect, useRef } from 'react';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Download, 
  Upload, 
  Clock, 
  FileText, 
  Zap,
  Archive
} from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { useRdLnMemory } from '../hooks/useRdLnMemory';

interface RdLnMemoryDropdownProps extends BaseComponentProps {
  /** Whether dropdown is open */
  isOpen: boolean;
  /** Callback to close dropdown */
  onClose: () => void;
  /** Whether there are saved sessions available */
  hasSessions: boolean;
  /** Number of saved sessions */
  sessionCount: number;
  /** Callback when save current session is requested */
  onSaveSession?: () => void;
  /** Callback when a session should be loaded */
  onLoadSession?: (sessionId: string) => void;
  /** Callback when a session should be deleted */
  onDeleteSession?: (sessionId: string) => void;
  /** Callback when all sessions should be cleared */
  onClearAll?: () => void;
  /** Callback when export is requested */
  onExport?: () => void;
  /** Callback when import is requested */
  onImport?: (jsonData: string) => void;
  /** Current content lengths for smart save detection */
  contentLength?: number;
  /** Size of the parent button for positioning */
  buttonSize?: 'small' | 'medium' | 'large';
}

/**
 * RdLn Memory Dropdown Component
 * 
 * A sophisticated dropdown menu with glassmorphism effects for session management.
 * Integrates seamlessly with the RdLn Memory system.
 */
export const RdLnMemoryDropdown: React.FC<RdLnMemoryDropdownProps> = ({
  isOpen,
  onClose,
  hasSessions,
  sessionCount,
  onSaveSession,
  onLoadSession,
  onDeleteSession,
  onClearAll,
  onExport,
  onImport,
  contentLength = 0,
  buttonSize = 'medium',
  style,
  className
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get sessions from RdLn Memory hook
  const { sessions } = useRdLnMemory();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle file import
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && onImport) {
        onImport(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  // Format character count
  const formatCharCount = (count: number): string => {
    if (count > 1000) {
      return `${(count / 1000).toFixed(1)}k chars`;
    }
    return `${count} chars`;
  };

  // Get positioning classes based on button size
  const getPositionClasses = () => {
    const positions = {
      small: 'top-10 right-0',
      medium: 'top-12 right-0', 
      large: 'top-16 right-0'
    };
    return positions[buttonSize];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
      
      {/* Dropdown Menu */}
      <div
        ref={dropdownRef}
        className={`absolute ${getPositionClasses()} w-80 z-50 ${className || ''}`}
        style={style}
      >
        {/* Glassmorphism Panel */}
        <div className="glassmorphism-panel backdrop-blur-xl bg-theme-glassPanelBg/75 border border-theme-glassPanelBorder/30 rounded-xl shadow-2xl p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme-glassPanelBorder/20">
            <Archive className="w-5 h-5 text-theme-accent-400" />
            <h3 className="text-theme-textHeader font-semibold">RdLn Memory</h3>
            <div className="ml-auto text-xs text-theme-textSecondary">
              {sessionCount} session{sessionCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 mb-4">
            {/* Save Current Session */}
            <button
              onClick={() => {
                onSaveSession?.();
                onClose();
              }}
              disabled={contentLength === 0}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-theme-accent-500/20 hover:bg-theme-accent-500/30 text-theme-textBody transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Save className="w-4 h-4 text-theme-accent-400 group-hover:text-theme-accent-300" />
              <div className="flex-1 text-left">
                <div className="font-medium">Save Current</div>
                <div className="text-xs text-theme-textSecondary">
                  {contentLength > 0 ? formatCharCount(contentLength) : 'No content to save'}
                </div>
              </div>
              {contentLength > 100 && (
                <Zap className="w-3 h-3 text-theme-accent-300 animate-pulse" />
              )}
            </button>
          </div>

          {/* Recent Sessions */}
          {hasSessions ? (
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="text-sm font-medium text-theme-textSecondary mb-2">Recent Sessions</div>
              
              {sessions.slice(0, 8).map((session) => (
                <div
                  key={session.id}
                  className="group flex items-center gap-2 p-2 rounded-lg bg-theme-glassPanelBg/30 hover:bg-theme-glassPanelHover/40 border border-theme-glassPanelBorder/10 hover:border-theme-glassPanelHoverBorder/30 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 text-theme-textInteractive flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-theme-textBody text-sm truncate">
                      {session.sessionName}
                    </div>
                    <div className="text-xs text-theme-textSecondary flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(session.timestamp)}
                      <span>•</span>
                      {formatCharCount(session.characterCount)}
                      {session.hasResult && <span>• ✓ Compared</span>}
                    </div>
                    <div className="text-xs text-theme-textSecondary/70 truncate mt-1">
                      {session.preview}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => {
                        onLoadSession?.(session.id);
                        onClose();
                      }}
                      className="p-1.5 rounded-md bg-theme-accent-500/20 hover:bg-theme-accent-500/40 text-theme-accent-400 hover:text-theme-accent-300 transition-all duration-200"
                      title="Load session"
                    >
                      <FolderOpen className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteSession?.(session.id);
                      }}
                      className="p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              
              {sessions.length > 8 && (
                <div className="text-xs text-theme-textSecondary text-center py-2">
                  ... and {sessions.length - 8} more sessions
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-theme-textSecondary">
              <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">No saved sessions</div>
              <div className="text-xs mt-1">Save your comparisons to get started</div>
            </div>
          )}

          {/* Management Actions */}
          <div className="pt-3 border-t border-theme-glassPanelBorder/20">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onExport?.();
                  onClose();
                }}
                disabled={!hasSessions}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-theme-secondary-500/20 hover:bg-theme-secondary-500/30 text-theme-textBody text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 p-2 rounded-lg bg-theme-secondary-500/20 hover:bg-theme-secondary-500/30 text-theme-textBody text-sm transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
            </div>
            
            {hasSessions && (
              <button
                onClick={() => {
                  if (confirm(`Delete all ${sessionCount} sessions? This cannot be undone.`)) {
                    onClearAll?.();
                    onClose();
                  }
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 text-sm transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Sessions
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
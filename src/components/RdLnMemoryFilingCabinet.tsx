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
  Archive,
  X,
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { useRdLnMemory } from '../hooks/useRdLnMemory';

interface RdLnMemoryFilingCabinetProps extends BaseComponentProps {
  /** Whether filing cabinet is open */
  isOpen: boolean;
  /** Callback to open/close filing cabinet */
  onToggle: () => void;
  /** Whether there are saved sessions available */
  hasSessions: boolean;
  /** Number of saved sessions */
  sessionCount: number;
  /** Whether sessions are currently loading */
  isLoading?: boolean;
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
}

/**
 * RdLn Memory Filing Cabinet Component
 * 
 * A unified filing cabinet that slides out from the right edge of the browser.
 * Combines the edge tab and side panel into one cohesive component that animates as a single unit.
 */
export const RdLnMemoryFilingCabinet: React.FC<RdLnMemoryFilingCabinetProps> = ({
  isOpen,
  onToggle,
  hasSessions,
  sessionCount,
  isLoading = false,
  onSaveSession,
  onLoadSession,
  onDeleteSession,
  onClearAll,
  onExport,
  onImport,
  contentLength = 0,
  style,
  className
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get sessions from RdLn Memory hook
  const { sessions } = useRdLnMemory();

  // Handle escape key to close panel
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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
        onToggle(); // Close after import
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
      
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[9998] transition-all duration-500 ease-out ${
          isOpen 
            ? 'bg-black bg-opacity-30 backdrop-blur-sm visible opacity-100' 
            : 'invisible opacity-0'
        }`}
        onClick={onToggle}
      />
      
      {/* Filing Cabinet Container - Slides as one unit */}
      <div
        className={`
          fixed top-0 right-0 h-full z-[9999]
          transition-transform duration-500 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${className || ''}
        `}
        style={style}
      >
        {/* Edge Tab - Fixed part of the filing cabinet */}
        <div
          className="absolute z-[10000]"
          style={{
            top: '3.9rem',
            left: '-48px', // Position tab to the left of the panel
            height: '96px',
            width: '48px'
          }}
        >
          <button
            onClick={onToggle}
            className={`
              glass-panel 
              w-full h-full 
              flex flex-col items-center justify-center gap-1
              transition-all duration-300
              hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
              relative overflow-hidden
              rounded-l-xl
            `}
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderRight: 'none'
            }}
            title={`RdLn Memory (${sessionCount} sessions)`}
            aria-label={`Toggle RdLn Memory filing cabinet with ${sessionCount} saved sessions`}
            disabled={isLoading}
          >
            {/* Filing cabinet icon */}
            <div className={`text-lg transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
              🗂️
            </div>
            
            {/* Directional chevron indicator - moved down for better spacing */}
            <div className="transition-transform duration-300 mt-1">
              {isOpen ? (
                <ChevronRight className="w-3 h-3 text-theme-textSecondary" />
              ) : (
                <ChevronLeft className="w-3 h-3 text-theme-textSecondary" />
              )}
            </div>
            
            {/* Loading indicator */}
            {isLoading && (
              <div
                className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center"
                aria-hidden="true"
              >
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </button>
          
          {/* Session count badge - positioned outside button to avoid overflow clipping */}
          {sessionCount > 0 && (
            <div
              className={`
                absolute -top-1.5 -left-1.5 z-[10001]
                bg-red-500 text-white text-xs font-bold
                rounded-full min-w-[20px] h-5 px-1
                flex items-center justify-center
                shadow-lg
                transition-all duration-300
                ${sessionCount > 99 ? 'text-[10px]' : ''}
                ${isOpen ? 'scale-110' : ''}
              `}
              aria-hidden="true"
            >
              {sessionCount > 99 ? '99+' : sessionCount}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div
          ref={panelRef}
          className="w-[450px] h-full"
        >
          {/* Glassmorphism Panel Container */}
          <div 
            className="glass-panel h-full rounded-l-xl rounded-r-none flex flex-col"
            style={{
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderLeft: 'none'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-theme-glassPanelBorder/20">
              <div className="flex items-center gap-3">
                <Archive className="w-6 h-6 text-theme-accent-400" />
                <div>
                  <h2 className="text-xl font-bold text-theme-textHeader">RdLn Memory</h2>
                  <p className="text-sm text-theme-textSecondary">Filing Cabinet</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-sm text-theme-textSecondary">
                  {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={onToggle}
                  className="p-2 rounded-lg hover:bg-theme-glassPanelHover/40 text-theme-textSecondary hover:text-theme-textHeader transition-all duration-200"
                  title="Close RdLn Memory"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Save Current Session - Enhanced */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-theme-textHeader">Quick Actions</h3>
                <button
                  onClick={() => {
                    onSaveSession?.();
                    onToggle();
                  }}
                  disabled={contentLength === 0}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-theme-accent-500/20 hover:bg-theme-accent-500/30 text-theme-textBody transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="p-2 rounded-lg bg-theme-accent-500/30 group-hover:bg-theme-accent-500/50 transition-colors">
                    <Save className="w-5 h-5 text-theme-accent-400 group-hover:text-theme-accent-300" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-base">Save Current Session</div>
                    <div className="text-sm text-theme-textSecondary">
                      {contentLength > 0 ? formatCharCount(contentLength) : 'No content to save'}
                    </div>
                  </div>
                  {contentLength > 100 && (
                    <Zap className="w-4 h-4 text-theme-accent-300 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Recent Sessions - Enhanced */}
              {hasSessions ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-theme-textHeader">Recent Sessions</h3>
                    <div className="text-sm text-theme-textSecondary">
                      {sessions.length > 0 && `Showing ${Math.min(sessions.length, 12)} of ${sessions.length}`}
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {sessions.slice(0, 12).map((session) => (
                      <div
                        key={session.id}
                        className="group flex items-start gap-4 p-4 rounded-xl bg-theme-glassPanelBg/30 hover:bg-theme-glassPanelHover/40 border border-theme-glassPanelBorder/10 hover:border-theme-glassPanelHoverBorder/30 transition-all duration-200"
                      >
                        <div className="p-2 rounded-lg bg-theme-textInteractive/20 flex-shrink-0 mt-1">
                          <FileText className="w-4 h-4 text-theme-textInteractive" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-theme-textBody text-base mb-1 truncate">
                            {session.sessionName}
                          </div>
                          <div className="text-sm text-theme-textSecondary flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(session.timestamp)}
                            <span>•</span>
                            {formatCharCount(session.characterCount)}
                            {session.hasResult && <span>• ✅ Compared</span>}
                          </div>
                          <div className="text-sm text-theme-textSecondary/80 line-clamp-2 leading-relaxed">
                            {session.preview}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              onLoadSession?.(session.id);
                              onToggle();
                            }}
                            className="p-2 rounded-lg bg-theme-accent-500/20 hover:bg-theme-accent-500/40 text-theme-accent-400 hover:text-theme-accent-300 transition-all duration-200"
                            title="Load session"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              onDeleteSession?.(session.id);
                            }}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {sessions.length > 12 && (
                      <div className="text-sm text-theme-textSecondary text-center py-3 bg-theme-glassPanelBg/20 rounded-lg">
                        ... and {sessions.length - 12} more sessions
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Archive className="w-16 h-16 mx-auto mb-4 opacity-30 text-theme-textSecondary" />
                  <div className="text-lg font-semibold text-theme-textSecondary mb-2">No saved sessions</div>
                  <div className="text-sm text-theme-textSecondary">
                    Start comparing documents to build your filing cabinet
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-4 border-t border-theme-glassPanelBorder/20 bg-theme-glassPanelBg/30">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onExport?.();
                      onToggle();
                    }}
                    disabled={!hasSessions}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-theme-secondary-500/20 hover:bg-theme-secondary-500/30 text-theme-textBody transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export</span>
                  </button>
                  
                  <button
                    onClick={handleImportClick}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-theme-secondary-500/20 hover:bg-theme-secondary-500/30 text-theme-textBody transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">Import</span>
                  </button>
                </div>
                
                {hasSessions && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete all ${sessionCount} sessions? This cannot be undone.`)) {
                        onClearAll?.();
                        onToggle();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="font-medium">Clear All Sessions</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
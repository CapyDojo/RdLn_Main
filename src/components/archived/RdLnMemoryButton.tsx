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

import React, { useState } from 'react';
import { Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';
import { RdLnMemoryDropdown } from './RdLnMemoryDropdown';

interface RdLnMemoryButtonProps extends BaseComponentProps {
  /** Whether there are saved sessions available */
  hasSessions: boolean;
  /** Number of saved sessions */
  sessionCount: number;
  /** Whether currently loading sessions */
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
  /** Button size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether button should be compact (for tight spaces) */
  compact?: boolean;
}

/**
 * RdLn Memory Button Component
 * 
 * A sophisticated session management button that integrates with existing controls.
 * Features dropdown for session management with glassmorphism styling.
 */
export const RdLnMemoryButton: React.FC<RdLnMemoryButtonProps> = ({
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
  size = 'medium',
  compact = false,
  style,
  className
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // Close dropdown when clicking outside or after actions
  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // Determine button styling based on size and state
  const getButtonClasses = () => {
    const baseClasses = "enhanced-button flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl relative";
    
    // Size variations
    const sizeClasses = {
      small: compact ? "w-8 h-8 rounded-lg" : "w-10 h-10 rounded-lg",
      medium: compact ? "w-10 h-10 rounded-full" : "w-12 h-12 rounded-full", 
      large: "w-14 h-14 rounded-full"
    };
    
    // State-based styling
    const stateClasses = hasSessions
      ? "bg-theme-accent-500 text-white hover:bg-theme-accent-600"
      : "bg-theme-neutral-300 text-theme-neutral-700 hover:bg-theme-neutral-400";
    
    return `${baseClasses} ${sizeClasses[size]} ${stateClasses}`;
  };

  // Icon size based on button size
  const getIconSize = () => {
    const sizes = {
      small: compact ? "w-3 h-3" : "w-4 h-4",
      medium: compact ? "w-4 h-4" : "w-5 h-5",
      large: "w-6 h-6"
    };
    return sizes[size];
  };

  // Tooltip content
  const getTooltipContent = () => {
    if (isLoading) return "Loading sessions...";
    if (hasSessions) {
      return `RdLn Memory (${sessionCount} session${sessionCount !== 1 ? 's' : ''})`;
    }
    return contentLength > 0 ? "Save to RdLn Memory" : "RdLn Memory (empty)";
  };

  return (
    <div className="relative" style={style}>
      <CustomTooltip content={getTooltipContent()} shortcut="Alt+M">
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className={`${getButtonClasses()} ${className || ''}`}
          aria-label="RdLn Memory"
          aria-expanded={isDropdownOpen}
          data-rdln-memory-button
        >
          <Archive className={getIconSize()} />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          )}
          
          {/* Session count indicator */}
          {hasSessions && !isLoading && (
            <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-theme-accent-300 text-theme-accent-900 rounded-full text-xs font-bold flex items-center justify-center px-1">
              {sessionCount > 99 ? '99+' : sessionCount}
            </div>
          )}
          
          {/* Dropdown arrow for larger sizes */}
          {size !== 'small' && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-theme-neutral-800 rounded-full flex items-center justify-center">
              {isDropdownOpen ? 
                <ChevronUp className="w-2 h-2 text-white" /> : 
                <ChevronDown className="w-2 h-2 text-white" />
              }
            </div>
          )}
          
          {/* Quick save indicator when content is available */}
          {contentLength > 100 && !hasSessions && (
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border border-white shadow-sm" title="Ready to save"></div>
          )}
        </button>
      </CustomTooltip>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <RdLnMemoryDropdown
          isOpen={isDropdownOpen}
          onClose={closeDropdown}
          hasSessions={hasSessions}
          sessionCount={sessionCount}
          onSaveSession={onSaveSession}
          onLoadSession={onLoadSession}
          onDeleteSession={onDeleteSession}
          onClearAll={onClearAll}
          onExport={onExport}
          onImport={onImport}
          contentLength={contentLength}
          buttonSize={size}
        />
      )}
    </div>
  );
};
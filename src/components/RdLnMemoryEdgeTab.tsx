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

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BaseComponentProps } from '../types/components';

interface RdLnMemoryEdgeTabProps extends BaseComponentProps {
  /** Number of saved sessions to display in badge */
  sessionCount: number;
  /** Whether the panel is currently open */
  isOpen: boolean;
  /** Callback when tab is clicked */
  onClick: () => void;
  /** Whether sessions are currently loading */
  isLoading?: boolean;
}

/**
 * Fixed edge tab for RdLn Memory system
 * 
 * Positioned at the right edge of the browser window, aligned with the header card.
 * Provides always-on access to the RdLn Memory filing cabinet functionality.
 */
export const RdLnMemoryEdgeTab: React.FC<RdLnMemoryEdgeTabProps> = ({
  sessionCount,
  isOpen,
  onClick,
  isLoading = false,
  style,
  className
}) => {
  return (
    <div
      className={`fixed z-[9999] transition-all duration-300 ${className || ''}`}
      style={{
        // Position aligned with header card (moved down slightly)
        top: '3.9rem', // Moved down from 2rem
        right: isOpen ? '450px' : '0px', // Slide with panel
        height: '96px', // Match header card height (nav with padding)
        width: '48px', // Same width as theme selector button
        ...style
      }}
    >
      <button
        onClick={onClick}
        className={`
          glass-panel 
          w-full h-full 
          flex flex-col items-center justify-center gap-1
          transition-all duration-300
          hover:scale-105 hover:-translate-x-1
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          relative overflow-hidden
          rounded-l-xl
          border-r-0
        `}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0
        }}
        title={`RdLn Memory (${sessionCount} sessions)`}
        aria-label={`Open RdLn Memory filing cabinet with ${sessionCount} saved sessions`}
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
        
        {/* Visual connection line when open */}
        {isOpen && (
          <div
            className="absolute top-0 left-full w-1 h-full bg-gradient-to-b from-transparent via-white via-opacity-20 to-transparent"
            aria-hidden="true"
          />
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
  );
};
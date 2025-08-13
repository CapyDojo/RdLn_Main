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
  /** Callback when tab is hovered (for coordinated hover states) */
  onHover?: (isHovered: boolean) => void;
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
  onHover,
  style,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      data-memory-tab
      className={`fixed z-[9999] transition-all duration-500 ease-out ${className || ''}`}
      style={{
        // Position aligned with header card (moved down slightly)
        top: '3.9rem',
        right: isOpen ? '423px' : '0px', // Slide with panel
        height: '90px', // Match header card height (nav with padding)
        width: '43.5px', // Compact edge tab width
        transform: isHovered ? 'translateY(-2px)' : '',
        ...style
      }}
    >
      <button
        onClick={onClick}
        onMouseEnter={() => {
          // Apply hover effects to BOTH tab and panel - unified elevation
          const memoryTabs = document.querySelectorAll('[data-memory-tab] .glass-panel');
          const memoryPanels = document.querySelectorAll('[data-memory-panel] .glass-panel');

          // Apply to tab (self)
          memoryTabs.forEach(tab => {
            const element = tab as HTMLElement;
            element.classList.add('hover-from-tab', 'shadow-xl');
            element.style.transform = 'translateY(-2px)';
            element.style.transition = 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)';
          });

          // Apply to panel
          memoryPanels.forEach(panel => {
            const element = panel as HTMLElement;
            element.classList.add('hover-from-tab', 'shadow-xl');
            element.style.transform = 'translateY(-2px)';
            element.style.transition = 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)';
          });

          // Dispatch custom event for backdrop coordination
          window.dispatchEvent(new CustomEvent('rdln-memory-tab-hover', {
            detail: { isHovered: true }
          }));

          setIsHovered(true);
          onHover?.(true);
        }}
        onMouseLeave={() => {
          // Remove hover effects from BOTH tab and panel
          const memoryTabs = document.querySelectorAll('[data-memory-tab] .glass-panel');
          const memoryPanels = document.querySelectorAll('[data-memory-panel] .glass-panel');

          // Remove from tab (self)
          memoryTabs.forEach(tab => {
            const element = tab as HTMLElement;
            element.classList.remove('hover-from-tab', 'shadow-xl');
            element.style.transform = '';
          });

          // Remove from panel
          memoryPanels.forEach(panel => {
            const element = panel as HTMLElement;
            element.classList.remove('hover-from-tab', 'shadow-xl');
            element.style.transform = '';
          });

          // Dispatch custom event for backdrop coordination
          window.dispatchEvent(new CustomEvent('rdln-memory-tab-hover', {
            detail: { isHovered: false }
          }));

          setIsHovered(false);
          onHover?.(false);
        }}
        className={`
          glass-panel 
          w-full h-full 
          flex flex-col items-center justify-center gap-1
          transition-all duration-500 ease-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
          relative overflow-hidden
          ${isOpen ? 'bg-theme-accent-500/10 border-theme-accent-500/30' : ''}
        `}
        style={{
          borderTopLeftRadius: '0.75rem',
          borderBottomLeftRadius: '0.75rem',
          borderTopRightRadius: '0',
          borderBottomRightRadius: '0',
          borderRight: 'none'
        }}
        title={`RdLn Memory (${sessionCount} sessions)`}
        aria-label={`Open RdLn Memory filing cabinet with ${sessionCount} saved sessions`}
        disabled={isLoading}
      >
        {/* Filing cabinet icon - changes based on state */}
        <div className={`text-2xl transition-all duration-500 ease-out ${isOpen ? 'scale-110' : ''}`}>
          {isOpen ? '📂' : '🗂️'}
        </div>

        {/* Directional chevron indicator - moved down for better spacing */}
        <div className="transition-transform duration-500 ease-out mt-1">
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
            transition-all duration-500 ease-out
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
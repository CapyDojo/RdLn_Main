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

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { BaseComponentProps } from '../types/components';

interface CustomTooltipProps extends BaseComponentProps {
  /** Main tooltip content */
  content: string;
  /** Optional keyboard shortcut to display */
  shortcut?: string;
  /** Tooltip placement relative to trigger */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right' | 'auto';
  /** Delay before showing tooltip in milliseconds */
  delay?: number;
  /** Whether tooltip is disabled */
  disabled?: boolean;
  /** Children that trigger the tooltip */
  children: ReactNode;
}

/**
 * CustomTooltip Component
 * 
 * Fast-displaying tooltip with glassmorphism styling and keyboard shortcut support.
 * Designed to replace slow native browser tooltips with 200ms delay.
 */
export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  content,
  shortcut,
  placement = 'bottom-right',
  delay = 200,
  disabled = false,
  children,
  style,
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right' | 'bottom-right'>('bottom-right');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate optimal placement based on viewport position
  const calculatePlacement = (): 'top' | 'bottom' | 'left' | 'right' | 'bottom-right' => {
    if (!triggerRef.current || placement !== 'auto') {
      return placement as 'top' | 'bottom' | 'left' | 'right' | 'bottom-right';
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Check available space in each direction
    const spaceTop = rect.top;
    const spaceBottom = viewport.height - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewport.width - rect.right;

    // Prefer diagonal bottom-right positioning (modern app standard)
    if (spaceBottom > 60 && spaceRight > 200) return 'bottom-right';
    
    // Fallback to traditional placements
    if (spaceTop > 100) return 'top';
    if (spaceBottom > 100) return 'bottom';
    if (spaceRight > 200) return 'right';
    if (spaceLeft > 200) return 'left';

    // Final fallback to direction with most space
    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
    if (maxSpace === spaceTop) return 'top';
    if (maxSpace === spaceBottom) return 'bottom';
    if (maxSpace === spaceRight) return 'right';
    return 'left';
  };

  const showTooltip = () => {
    if (disabled || !content.trim()) return;
    
    timeoutRef.current = setTimeout(() => {
      setActualPlacement(calculatePlacement());
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position classes based on placement
  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 pointer-events-none';
    
    switch (actualPlacement) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-3`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-3`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-3`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-3`;
      case 'bottom-right':
        return `${baseClasses} top-full left-0 mt-2 ml-6`;
      default:
        return `${baseClasses} top-full left-0 mt-2 ml-6`; // Default to bottom-right
    }
  };

  // Modern design - no arrow needed, clean shadow-based design

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className || ''}`}
      style={style}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getPositionClasses()}
          role="tooltip"
          aria-hidden="true"
        >
          {/* Modern tooltip without arrow - clean shadow design */}
          <div className="glass-panel px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-neutral-50/95 text-theme-primary-800 shadow-xl backdrop-blur-md border border-theme-neutral-200/50 max-w-80 min-w-32 shadow-theme-primary-900/20">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="leading-tight">{content}</span>
              {shortcut && (
                <kbd className="px-1.5 py-0.5 bg-theme-accent-100/80 border border-theme-accent-200/60 rounded text-theme-accent-800 font-mono text-xs shrink-0">
                  {shortcut}
                </kbd>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
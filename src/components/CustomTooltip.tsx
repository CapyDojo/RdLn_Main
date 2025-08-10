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
import { createPortal } from 'react-dom';
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate absolute position for tooltip portal
  const calculateTooltipPosition = (placementType: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right') => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    
    switch (placementType) {
      case 'top':
        return {
          top: rect.top + scrollY - 8, // 8px above
          left: rect.left + scrollX + rect.width / 2 // Center horizontally
        };
      case 'bottom':
        return {
          top: rect.bottom + scrollY + 8, // 8px below
          left: rect.left + scrollX + rect.width / 2 // Center horizontally
        };
      case 'left':
        return {
          top: rect.top + scrollY + rect.height / 2, // Center vertically
          left: rect.left + scrollX - 8 // 8px to the left
        };
      case 'right':
        return {
          top: rect.top + scrollY + rect.height / 2, // Center vertically
          left: rect.right + scrollX + 8 // 8px to the right
        };
      case 'bottom-right':
      default:
        return {
          top: rect.top + scrollY - 4, // Slightly above (-4px)
          left: rect.right + scrollX + 12 // 12px to the right
        };
    }
  };

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
      const placementType = calculatePlacement();
      const position = calculateTooltipPosition(placementType);
      setActualPlacement(placementType);
      setTooltipPosition(position);
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

  // Position classes for fixed positioning portal
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[9999] pointer-events-none';
    
    switch (actualPlacement) {
      case 'top':
        return `${baseClasses} transform -translate-x-1/2 -translate-y-full`;
      case 'bottom':
        return `${baseClasses} transform -translate-x-1/2`;
      case 'left':
        return `${baseClasses} transform -translate-x-full -translate-y-1/2`;
      case 'right':
        return `${baseClasses} transform -translate-y-1/2`;
      case 'bottom-right':
      default:
        return baseClasses; // No transform needed, position is already calculated
    }
  };

  // Modern design - no arrow needed, clean shadow-based design

  const tooltipContent = isVisible ? (
    <div
      ref={tooltipRef}
      className={getPositionClasses()}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
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
  ) : null;

  return (
    <>
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
      </div>
      
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};
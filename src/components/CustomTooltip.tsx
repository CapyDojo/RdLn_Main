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

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BaseComponentProps } from '../types/components';

interface CustomTooltipProps extends BaseComponentProps {
  /** Main tooltip content */
  content: string;
  /** Optional keyboard shortcut to display */
  shortcut?: string;
  /** Optional inline status badge (like ON/OFF) */
  status?: string;
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
  status,
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

  // Calculate viewport position for tooltip portal (fixed positioning)
  const calculateTooltipPosition = (placementType: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right') => {
    if (!triggerRef.current) return { top: 0, left: 0 };
    
    const rect = triggerRef.current.getBoundingClientRect();
    
    // For fixed positioning, we use viewport coordinates directly (no scroll offset needed)
    // getBoundingClientRect() already gives us viewport-relative positions
    
    switch (placementType) {
      case 'top':
        return {
          top: rect.top - 30, // Above the element with space for tooltip height
          left: rect.left - 207 // Just to the left of the element
        };
        
      case 'bottom':
        return {
          top: rect.bottom + 2, // Even closer: 2px below
          left: rect.right + 2 // Tucked: align to right edge + 2px
        };
        
      case 'left':
        // For precise alignment: tooltip's top-right corner touches element's bottom-left corner
        // Dynamic width based on content length
        let tooltipWidth = 285; // Default for "Auto" tooltip
        
        // Adjust width based on content for better alignment
        if (content.includes('Manually select')) {
          tooltipWidth = 220; // Narrower offset for Manual tooltip
        }
        
        return {
          top: rect.bottom, // Align tooltip top with element bottom
          left: rect.left - tooltipWidth // Position tooltip so its right edge touches element's left edge
        };
        
      case 'right':
        return {
          top: rect.bottom + 2, // Align to bottom edge + 2px
          left: rect.right + 2 // Even closer: 2px to the right
        };
        
      case 'bottom-right':
      default:
        return {
          top: rect.bottom + 2, // Even closer: 2px below
          left: rect.right + 2 // Even closer: 2px to the right
        };
    }
  };

  // Calculate optimal placement based on viewport position and screen location
  const calculatePlacement = (): 'top' | 'bottom' | 'left' | 'right' | 'bottom-right' => {
    if (!triggerRef.current) return 'bottom-right';
    
    // If user specified a placement, use it unless it's auto
    if (placement !== 'auto') {
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

    // Simplified positioning: default to close diagonal bottom-right for most cases
    // Only use other positions if there's insufficient space
    
    // Check if we have enough space for the compact diagonal positioning
    const minSpaceNeeded = 80; // Reduced from 200px since we're positioning closer
    
    // Try bottom-right diagonal first (works for most screen positions)
    if (spaceBottom > 40 && spaceRight > 40) {
      return 'bottom-right';
    }
    
    // Fallback based on available space
    if (spaceTop > minSpaceNeeded) return 'top';
    if (spaceLeft > minSpaceNeeded) return 'left'; 
    if (spaceRight > minSpaceNeeded) return 'right';
    if (spaceBottom > minSpaceNeeded) return 'bottom';

    // Fallback to direction with most space
    const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
    if (maxSpace === spaceTop) return 'top';
    if (maxSpace === spaceBottom) return 'bottom';
    if (maxSpace === spaceRight) return 'right';
    return 'left';
  };

  // Update tooltip position (for scroll/zoom events)
  const updateTooltipPosition = useCallback(() => {
    if (!isVisible) return;
    
    const placementType = calculatePlacement();
    const position = calculateTooltipPosition(placementType);
    setActualPlacement(placementType);
    setTooltipPosition(position);
  }, [isVisible]); // Dependencies will be handled by the functions themselves

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

  // Handle scroll/zoom/resize events to maintain proper positioning
  useEffect(() => {
    const handleScrollOrResize = () => {
      updateTooltipPosition();
    };

    // Add event listeners when tooltip is visible
    if (isVisible) {
      // For fixed positioning, we need to track when elements move in viewport
      // This happens during window scroll, resize, or internal container scroll
      
      window.addEventListener('scroll', handleScrollOrResize, { passive: true });
      window.addEventListener('resize', handleScrollOrResize, { passive: true });
      
      // Find and listen to all scrollable containers in the app
      const scrollableContainers: HTMLElement[] = [];
      
      // App-specific scroll containers based on useScrollSync patterns
      const containerSelectors = [
        '[data-panel-id] .glass-panel-inner-content', // Desktop Option C layout
        '[data-panel-id][data-input-panel]',          // Mobile layout wrapper
        '[data-panel-id] textarea',                   // Textarea scroll
        '.scroll-container',                          // General scroll containers
        '[data-testid="scroll-container"]'            // Test scroll containers
      ];
      
      containerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
        elements.forEach(element => {
          // Only add if it's actually scrollable
          if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) {
            scrollableContainers.push(element);
          }
        });
      });
      
      // Add scroll listeners to all detected scrollable containers
      scrollableContainers.forEach(container => {
        container.addEventListener('scroll', handleScrollOrResize, { passive: true });
      });
      
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize);
        window.removeEventListener('resize', handleScrollOrResize);
        
        // Clean up container scroll listeners
        scrollableContainers.forEach(container => {
          container.removeEventListener('scroll', handleScrollOrResize);
        });
      };
    }
  }, [isVisible, updateTooltipPosition]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position classes for fixed positioning portal - no transforms needed for precise positioning
  const getPositionClasses = () => {
    return 'fixed z-[2147483647] pointer-events-none'; // Maximum z-index to ensure tooltips appear above browser UI
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
      <div className="glass-panel px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-neutral-50/95 text-theme-primary-800 shadow-xl backdrop-blur-md border border-theme-neutral-200/50 max-w-64 min-w-32 shadow-theme-primary-900/20">
        <div className="flex items-start gap-2">
          <span className="leading-tight whitespace-pre-line">{content}</span>
          {status && (
            <kbd className="px-1.5 py-0.5 bg-theme-accent-100/80 border border-theme-accent-200/60 rounded text-theme-accent-800 font-mono text-xs shrink-0">
              {status}
            </kbd>
          )}
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
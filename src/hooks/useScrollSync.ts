import { useRef, useCallback, useEffect, useState } from 'react';
import { DEV_CONFIG } from '../config/appConfig';
import { BaseHookReturn } from '../types/components';

interface UseScrollSyncConfig {
  /** Whether scroll synchronization is enabled */
  isScrollLocked: boolean;
  /** External ref for output panel (optional, for direct ref passing) */
  outputRef?: React.RefObject<HTMLDivElement>;
}

// SSMR: Standardized hook state and actions interfaces
interface UseScrollSyncState {
  /** Whether scroll synchronization is currently active */
  isScrollLocked: boolean;
  /** Current scroll element references */
  scrollRefs: {
    input1: HTMLElement | null;
    input2: HTMLElement | null;
    output: HTMLElement | null;
  };
  /** Whether layout detection has completed */
  isLayoutDetected: boolean;
}

interface UseScrollSyncActions {
  /** Update scroll element references based on current layout */
  updateScrollRefs: () => void;
  /** Synchronize scroll across all panels */
  syncScroll: (sourceElement: HTMLElement, scrollTop: number) => void;
  /** Toggle scroll synchronization on/off */
  toggleScrollLock: () => void;
}

// SSMR: Maintain backward compatibility with legacy return type
interface UseScrollSyncReturn extends BaseHookReturn<UseScrollSyncState, UseScrollSyncActions> {
  /** @deprecated Use state.scrollRefs instead */
  scrollRefs: React.MutableRefObject<{
    input1: HTMLElement | null;
    input2: HTMLElement | null;
    output: HTMLElement | null;
  }>;
  /** @deprecated Use actions.updateScrollRefs instead */
  updateScrollRefs: () => void;
  /** @deprecated Use actions.syncScroll instead */
  syncScroll: (sourceElement: HTMLElement, scrollTop: number) => void;
}

/**
 * useScrollSync Hook
 * 
 * Manages scroll synchronization between input panels and output panel.
 * Features elegant ref-based detection and layout adaptation.
 * 
 * Features:
 * - Automatic layout detection (desktop/mobile, Option C vs other layouts)
 * - Elegant ref-based output panel access
 * - Proper event listener management with cleanup
 * - Smooth percentage-based scroll synchronization
 * - Performance optimized with RAF and loop prevention
 */
export const useScrollSync = ({
  isScrollLocked,
  outputRef
}: UseScrollSyncConfig): UseScrollSyncReturn => {
  
  // ==================== STATE ====================
  
  // SSMR: Internal state for standardized interface
  const [isLayoutDetected, setIsLayoutDetected] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  // ==================== REFS ====================
  
  // Scroll element refs
  const scrollRefs = useRef({
    input1: null as HTMLElement | null,
    input2: null as HTMLElement | null,
    output: null as HTMLElement | null
  });
  
  // Loop prevention ref
  const isScrolling = useRef(false);
  
  // ==================== SCROLL SYNCHRONIZATION ====================
  
  const syncScroll = useCallback((sourceElement: HTMLElement, scrollTop: number) => {
    if (!isScrollLocked || isScrolling.current) return;
    
    isScrolling.current = true;
    
    const sourceScrollPercentage = scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight);
    
    Object.values(scrollRefs.current).forEach(element => {
      if (element && element !== sourceElement) {
        const targetScrollTop = sourceScrollPercentage * (element.scrollHeight - element.clientHeight);
        element.scrollTop = Math.max(0, targetScrollTop);
      }
    });
    
    // Use RAF to reset flag for smooth performance
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, [isScrollLocked]);

  // Deprecated: Lock state is controlled by parent via isScrollLocked prop
  const toggleScrollLock = useCallback(() => {
    if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
      console.log('🔄 toggleScrollLock is controlled by parent (no-op)');
    }
    // Intentionally no-op to avoid mutating unrelated state
  }, []);
  
  // ==================== ELEMENT DETECTION ====================
  
  const updateScrollRefs = useCallback(() => {
    try {
      setInternalError(null);
      
      // OPTION C FIX: Detect actual scroll containers based on current layout
      // Option C moves scrolling from textarea to .glass-panel-inner-content
      const inputContainers = document.querySelectorAll('[data-input-panel] .glass-panel-inner-content');
      
      // Check if Option C layout is active by testing scroll behavior
      const isOptionC = inputContainers.length > 0 && 
        inputContainers[0] && 
        getComputedStyle(inputContainers[0]).overflowY === 'auto';
      
      let input1Element = null;
      let input2Element = null;
      
      if (isOptionC) {
        // Option C: Use container elements for scroll events
        input1Element = inputContainers[0] as HTMLElement || null;
        input2Element = inputContainers[1] as HTMLElement || null;
      } else {
        // Other layouts: Use textarea elements for scroll events
        const inputTextareas = document.querySelectorAll('[data-input-panel] .glass-panel-inner-content textarea');
        input1Element = inputTextareas[0] as HTMLElement || null;
        input2Element = inputTextareas[1] as HTMLElement || null;
      }
      
      // ELEGANT FIX: Use ref-based detection for output panel instead of DOM queries
      const outputPanel = outputRef?.current || null;
      
      scrollRefs.current = {
        input1: input1Element,
        input2: input2Element,
        output: outputPanel
      };
      
      // SSMR: Update layout detection status
      setIsLayoutDetected(!!input1Element && !!input2Element);
      
      // Debug logging (guarded)
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) console.log('🔄 SCROLL SYNC: Scroll elements detected via layout adaptation:', {
        input1: !!scrollRefs.current.input1,
        input2: !!scrollRefs.current.input2,
        output: !!scrollRefs.current.output,
        outputRefDirect: !!outputRef?.current,
        isScrollLocked,
        isOptionC,
        layoutDetection: isOptionC ? 'Option C (container scroll)' : 'Other layout (textarea scroll)',
        input1Type: input1Element?.tagName,
        input2Type: input2Element?.tagName,
        outputType: outputPanel?.tagName,
        outputHasOverflow: outputPanel ? getComputedStyle(outputPanel).overflowY : 'no element',
        outputScrollHeight: outputPanel?.scrollHeight,
        outputClientHeight: outputPanel?.clientHeight
      });
    } catch (error) {
      console.error('Error updating scroll refs:', error);
      setInternalError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isScrollLocked, outputRef]);
  
  // ==================== EVENT LISTENER MANAGEMENT ====================
  
  // Event listener management (Reversible - only when locked)
  useEffect(() => {
    if (!isScrollLocked) return;
    
    updateScrollRefs();
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      syncScroll(target, target.scrollTop);
    };
    
    // Add listeners to all scroll areas
    Object.values(scrollRefs.current).forEach(element => {
      if (element) {
        element.addEventListener('scroll', handleScroll, { passive: true });
        if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
          console.log('🔗 SCROLL SYNC: Added scroll listener to:', element.tagName);
        }
      }
    });
    
    return () => {
      Object.values(scrollRefs.current).forEach(element => {
        if (element) {
          element.removeEventListener('scroll', handleScroll);
          if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
            console.log('🔓 SCROLL SYNC: Removed scroll listener from:', element.tagName);
          }
        }
      });
    };
  }, [isScrollLocked, syncScroll, updateScrollRefs]);
  
  // ==================== RETURN INTERFACE ====================
  
  // SSMR: Standardized state and actions
  const hookState: UseScrollSyncState = {
    isScrollLocked,
    scrollRefs: scrollRefs.current,
    isLayoutDetected
  };
  
  const hookActions: UseScrollSyncActions = {
    updateScrollRefs,
    syncScroll,
    toggleScrollLock
  };
  
  const hookStatus = {
    isInitialized: true,
    error: internalError
  };
  
  // SSMR: Return both standardized and legacy interfaces for backward compatibility
  return {
    // Standardized interface
    state: hookState,
    actions: hookActions,
    status: hookStatus,
    
    // Legacy interface (backward compatibility)
    scrollRefs,
    updateScrollRefs,
    syncScroll
  };
};

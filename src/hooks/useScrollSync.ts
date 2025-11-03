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
    if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
      console.log('🔄 SYNC SCROLL CALLED:', {
        isScrollLocked,
        isScrolling: isScrolling.current,
        sourceElement: sourceElement.tagName + ' ' + sourceElement.className,
        scrollTop,
        scrollHeight: sourceElement.scrollHeight,
        clientHeight: sourceElement.clientHeight
      });
    }
    
    if (!isScrollLocked || isScrolling.current) {
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log('🚫 SYNC SCROLL BLOCKED:', { isScrollLocked, isScrolling: isScrolling.current });
      }
      return;
    }
    
    isScrolling.current = true;
    
    const sourceScrollPercentage = scrollTop / (sourceElement.scrollHeight - sourceElement.clientHeight);
    
    if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
      console.log('📊 SYNC CALCULATION:', {
        sourceScrollPercentage,
        willSyncTo: Object.values(scrollRefs.current).filter(el => el && el !== sourceElement).length + ' elements'
      });
    }
    
    Object.values(scrollRefs.current).forEach((element, index) => {
      if (element && element !== sourceElement) {
        const targetScrollTop = sourceScrollPercentage * (element.scrollHeight - element.clientHeight);
        const finalScrollTop = Math.max(0, targetScrollTop);
        element.scrollTop = finalScrollTop;
        
        if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
          const elementName = index === 0 ? 'input1' : index === 1 ? 'input2' : 'output';
          console.log(`🎯 SYNCED ${elementName}:`, {
            element: element.tagName + ' ' + element.className,
            targetScrollTop,
            finalScrollTop,
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight
          });
        }
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
      
      // VISIBLE ELEMENT SEARCH: Find the visible layout's scrollable elements
      const findScrollableElement = (panelId: 'original' | 'revised'): HTMLElement | null => {
        // Get ALL matching elements from both desktop and mobile layouts
        const allElements = Array.from(document.querySelectorAll(`[data-panel-id="${panelId}"] .glass-panel-inner-content.overflow-y-auto`)) as HTMLElement[];
        
        // Find the element that's actually visible (not hidden by responsive CSS)
        const visibleElement = allElements.find(element => {
          const styles = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return styles.display !== 'none' && 
                 styles.visibility !== 'hidden' && 
                 rect.width > 0 && 
                 rect.height > 0;
        });
        
        if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
          console.log(`🔍 VISIBLE ELEMENT SEARCH for ${panelId}:`, {
            totalElementsFound: allElements.length,
            visibleElementFound: !!visibleElement,
            elementDetails: allElements.map((el, i) => ({
              index: i,
              isVisible: el === visibleElement,
              display: getComputedStyle(el).display,
              visibility: getComputedStyle(el).visibility,
              width: el.getBoundingClientRect().width,
              height: el.getBoundingClientRect().height,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              parentLayoutClass: el.closest('.lg\\:hidden, .hidden')?.className || 'no-layout-class'
            }))
          });
          
          if (visibleElement) {
            console.log(`🎯 VISIBLE ELEMENT for ${panelId}:`, {
              scrollHeight: visibleElement.scrollHeight,
              clientHeight: visibleElement.clientHeight,
              isScrollable: visibleElement.scrollHeight > visibleElement.clientHeight,
              boundingRect: visibleElement.getBoundingClientRect(),
              computedStyle: {
                display: getComputedStyle(visibleElement).display,
                height: getComputedStyle(visibleElement).height,
                overflowY: getComputedStyle(visibleElement).overflowY
              }
            });
          }
        }
        
        return visibleElement || null;
      };

      const input1Element = findScrollableElement('original');
      const input2Element = findScrollableElement('revised');

      // Determine if we are in the "Option C" layout for the legacy return value
      const isOptionC = input1Element === document.querySelector('[data-panel-id="original"] .glass-panel-inner-content');

      const outputPanel = outputRef?.current || null;

      scrollRefs.current = {
        input1: input1Element,
        input2: input2Element,
        output: outputPanel
      };

      setIsLayoutDetected(!!input1Element && !!input2Element);

      // Simplified debug logging
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log(`🔄 SCROLL SYNC: Element detection complete:`, {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          detection: {
            input1Found: !!scrollRefs.current.input1,
            input2Found: !!scrollRefs.current.input2,
            outputFound: !!scrollRefs.current.output,
            layoutDetected: !!input1Element && !!input2Element
          },
          elements: {
            input1Type: input1Element?.tagName,
            input1Classes: input1Element?.className,
            input1ScrollHeight: input1Element?.scrollHeight,
            input1ClientHeight: input1Element?.clientHeight,
            input2Type: input2Element?.tagName,
            input2Classes: input2Element?.className,
            input2ScrollHeight: input2Element?.scrollHeight,
            input2ClientHeight: input2Element?.clientHeight,
            outputType: outputPanel?.tagName,
            outputClasses: outputPanel?.className
          },
          state: {
            isScrollLocked,
            isOptionC,
            outputRefDirect: !!outputRef?.current,
            outputHasOverflow: outputPanel ? getComputedStyle(outputPanel).overflowY : 'no element',
            outputScrollHeight: outputPanel?.scrollHeight,
            outputClientHeight: outputPanel?.clientHeight
          }
        });
      }
    } catch (error) {
      console.error('Error updating scroll refs:', error);
      setInternalError(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [isScrollLocked, outputRef]);

  // Retry mechanism for timing issues - sometimes DOM isn't ready immediately
  const updateScrollRefsWithRetry = useCallback(async (retries = 2, delay = 100) => {
    let attempts = 0;
    
    while (attempts <= retries) {
      updateScrollRefs();
      
      const hasValidElements = scrollRefs.current.input1 && scrollRefs.current.input2;
      
      if (hasValidElements || attempts === retries) {
        if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG && attempts > 0) {
          console.log(`🔄 SCROLL SYNC: Element detection succeeded after ${attempts} ${attempts === 1 ? 'retry' : 'retries'}`);
        }
        break;
      }
      
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log(`🔄 SCROLL SYNC: Elements not found, retrying in ${delay}ms... (attempt ${attempts + 1}/${retries + 1})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }
  }, [updateScrollRefs]);
  
  // ==================== EVENT LISTENER MANAGEMENT ====================
  
  // Debug: Track scroll lock state changes
  useEffect(() => {
    if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
      console.log(`🔧 SCROLL SYNC: State changed - isScrollLocked: ${isScrollLocked}`);
    }
  }, [isScrollLocked]);

  // Layout change detection for desktop/mobile transitions
  const [layoutReinitTrigger, setLayoutReinitTrigger] = useState(0);
  
  useEffect(() => {
    if (!isScrollLocked) return;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const isNowDesktop = currentWidth >= 1024; // lg breakpoint
      
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log(`🔄 SCROLL SYNC: Viewport changed to ${currentWidth}px (${isNowDesktop ? 'desktop' : 'mobile'})`);
      }

      // Trigger re-initialization by incrementing state
      setLayoutReinitTrigger(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isScrollLocked]);

  // Event listener management (Reversible - only when locked)
  useEffect(() => {
    if (!isScrollLocked) {
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log('🔓 SCROLL SYNC: Disabled - not setting up listeners');
      }
      return;
    }
    
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log('📜 SCROLL EVENT:', {
          target: target.tagName + ' ' + target.className,
          scrollTop: target.scrollTop,
          scrollHeight: target.scrollHeight,
          clientHeight: target.clientHeight,
          isScrollable: target.scrollHeight > target.clientHeight,
          isInScrollRefs: Object.values(scrollRefs.current).includes(target),
          viewport: window.innerWidth + 'x' + window.innerHeight
        });
      }
      
      syncScroll(target, target.scrollTop);
    };
    
    // Setup scroll sync with retry mechanism
    const setupScrollSync = async () => {
      await updateScrollRefsWithRetry();
      
      // Add listeners to all scroll areas after elements are found
      const elementsWithListeners = [];
      Object.values(scrollRefs.current).forEach((element, index) => {
        if (element) {
          element.addEventListener('scroll', handleScroll, { passive: true });
          const elementName = index === 0 ? 'input1' : index === 1 ? 'input2' : 'output';
          elementsWithListeners.push(elementName);
          
          if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
            console.log(`🔗 SCROLL SYNC: Added scroll listener to ${elementName}:`, element.tagName, element.className, {
              scrollHeight: element.scrollHeight,
              clientHeight: element.clientHeight,
              isCurrentlyScrollable: element.scrollHeight > element.clientHeight,
              hasOverflow: getComputedStyle(element).overflowY,
              elementId: element.id || 'no-id',
              dataAttrs: Array.from(element.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(' '),
              boundingRect: element.getBoundingClientRect()
            });
            
            // Test if the element can actually receive scroll events by adding a test listener
            const testHandler = () => console.log(`🧪 TEST SCROLL EVENT on ${elementName}`);
            element.addEventListener('scroll', testHandler, { passive: true, once: true });
            setTimeout(() => element.removeEventListener('scroll', testHandler), 5000);
          }
        }
      });
      
      if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
        console.log(`✅ SCROLL SYNC: Setup complete. Listening to ${elementsWithListeners.length} elements:`, elementsWithListeners);
        
        // Test scroll listeners by programmatically scrolling each element
        Object.values(scrollRefs.current).forEach((element, index) => {
          if (element) {
            const elementName = index === 0 ? 'input1' : index === 1 ? 'input2' : 'output';
            console.log(`🧪 TESTING ${elementName}: Programmatically scrolling to trigger event...`);
            
            // Save original scroll position
            const originalScrollTop = element.scrollTop;
            
            // Try to scroll the element
            element.scrollTop = originalScrollTop + 1;
            
            // Reset after a brief moment
            setTimeout(() => {
              element.scrollTop = originalScrollTop;
            }, 100);
          }
        });
      }
    };
    
    // Setup async but don't wait for it
    setupScrollSync().catch(error => {
      console.error('Failed to setup scroll sync:', error);
    });
    
    return () => {
      // Cleanup event listeners
      Object.values(scrollRefs.current).forEach(element => {
        if (element) {
          element.removeEventListener('scroll', handleScroll);
          if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) {
            console.log('🔓 SCROLL SYNC: Removed scroll listener from:', element.tagName);
          }
        }
      });
    };
  }, [isScrollLocked, syncScroll, updateScrollRefsWithRetry, layoutReinitTrigger]);
  
  // ==================== RETURN INTERFACE ====================
  
  // SSMR: Standardized state and actions
  const hookState: UseScrollSyncState = {
    isScrollLocked,
    scrollRefs: scrollRefs.current,
    isLayoutDetected
  };
  
  const hookActions: UseScrollSyncActions = {
    updateScrollRefs: updateScrollRefsWithRetry,
    syncScroll,
    toggleScrollLock
  };
  
  const hookStatus = {
    isInitialized: true,
    isLoading: false, // Add missing property
    error: internalError ? { id: 'scroll-sync-error', message: internalError, timestamp: Date.now(), canRetry: false } : null, // Conform to error object type
    lastUpdated: Date.now() // Add missing property
  };
  
  // SSMR: Return both standardized and legacy interfaces for backward compatibility
  return {
    // Standardized interface
    state: hookState,
    actions: hookActions,
    status: hookStatus,
    
    // Legacy interface (backward compatibility)
    scrollRefs,
    updateScrollRefs: updateScrollRefsWithRetry,
    syncScroll
  };
};

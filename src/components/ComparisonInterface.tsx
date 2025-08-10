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

import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { DEV_CONFIG } from '../config/appConfig';
import { AlertCircle } from 'lucide-react';
import { useComparison } from '../hooks/useComparison';
import { useUndoHistory } from '../hooks/useUndoHistory';
import { useRdLnMemory } from '../hooks/useRdLnMemory';
import { RedlineOutput } from './RedlineOutput';
import { ProcessingDisplay } from './ProcessingDisplay';
import { OutputLayout } from './OutputLayout';
import { PerformanceDemoCard } from './PerformanceDemoCard';

// Resize and scroll handlers
import { useResizeHandlers } from '../hooks/useResizeHandlers';
import { useScrollSync } from '../hooks/useScrollSync';
// Performance monitoring
import { useComponentPerformance, usePerformanceAwareHandler } from '../utils/performanceUtils.tsx';

import { DesktopControlsPanel } from './DesktopControlsPanel';
import { MobileControlsPanel } from './MobileControlsPanel';
import { RdLnMemoryButton } from './RdLnMemoryButton';
import { DesktopInputLayout } from './DesktopInputLayout';
import { MobileInputLayout } from './MobileInputLayout';
import { ExtremeTestSuite } from '../testing/ExtremeTestSuite';

// Experimental features
import { useExperimentalFeatures, useExperimentalCSSClasses } from '../contexts/ExperimentalLayoutContext';
import { FloatingJumpButton } from './experimental/FloatingJumpButton';
import { MobileTabInterface } from './experimental/MobileTabInterface';
import { StickyResultsPanel } from './experimental/StickyResultsPanel';
import { ResultsOverlay } from './experimental/ResultsOverlay';
import { FullScreenOverlay } from './FullScreenOverlay';
import { useJumpToResults } from '../hooks/useJumpToResults';

import { useMobileTabInterface } from '../hooks/useMobileTabInterface';
import { useResultsOverlay } from '../hooks/useResultsOverlay';

import { BaseComponentProps } from '../types/components';

interface ComparisonInterfaceProps extends BaseComponentProps {
  showAdvancedOcrCard?: boolean;
  showPerformanceDemoCard?: boolean;
  showExtremeTestSuite?: boolean;
  onToggleAdvancedOcr?: () => void;
  onTogglePerformanceDemo?: () => void;
  onToggleExtremeTestSuite?: () => void;
  onOverlayShow?: () => void;
  onOverlayHide?: () => void;
  onContentChange?: (hasContent: boolean) => void;
}

export interface ComparisonInterfaceRef {
  loadSampleData: (originalText: string, revisedText: string, autoRun?: boolean) => void;
}

export const ComparisonInterface = forwardRef<ComparisonInterfaceRef, ComparisonInterfaceProps>(({
  showAdvancedOcrCard = true,
  showPerformanceDemoCard = true,
  showExtremeTestSuite = false,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo,
  onToggleExtremeTestSuite,
  onOverlayShow,
  onOverlayHide,
  onContentChange,
  style,
  className,
  ...props
}, ref) => {
  // Performance monitoring setup
  const performanceTracker = useComponentPerformance(props, 'ComparisonInterface', {
    category: 'comparison',
    autoTrackRender: true,
    autoTrackInteractions: true
  });
  
  const {
    originalText,
    revisedText,
    result,
    isProcessing,
    error,
    setOriginalText,
    setRevisedText,
    compareDocuments,
    resetComparison,
    quickCompareEnabled,
    toggleQuickCompare,
    chunkingProgress,
    // SSMR: Cancellation support
    cancelComparison,
    isCancelling,
    // System Protection for stress testing
    systemProtectionEnabled,
    toggleSystemProtection
  } = useComparison();

  // Simple clear undo protection
  const { canUndo, saveClearState, undoClear, clearUndoState } = useUndoHistory();
  
  // RdLn Memory system for session management
  const { 
    sessions,
    hasSessions, 
    isLoading: isLoadingMemory,
    saveSession,
    loadSession,
    deleteSession,
    clearAllSessions,
    exportSessions,
    importSessions
  } = useRdLnMemory();
  
  

  const redlineOutputRef = useRef<HTMLDivElement>(null);

  // Define scoped sample loader so it can be passed as a prop and exposed via ref
  const loadSampleData = (originalText: string, revisedText: string, autoRun: boolean = false) => {
    setOriginalText(originalText);
    setRevisedText(revisedText);
    
    if (autoRun) {
      // Use setTimeout to ensure text is set before comparison
      setTimeout(() => {
        compareDocuments();
      }, 100);
    }
  };

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    loadSampleData
  }), [loadSampleData]);

  // Track content changes and notify parent
  useEffect(() => {
    const hasContent = originalText.trim().length > 0 || revisedText.trim().length > 0;
    if (onContentChange) {
      onContentChange(hasContent);
    }
    
    // Clear undo state when user starts typing new content
    // (Prevents accidentally restoring old cleared content when user has moved on)
    if (hasContent && canUndo) {
      clearUndoState();
    }
  }, [originalText, revisedText, onContentChange, canUndo, clearUndoState]);
  
  // SSMR Step 1: Scroll lock state (Safe - no functionality yet)
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  
  // Full screen overlay state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenBackgroundMode, setFullScreenBackgroundMode] = useState<'theme' | 'glassmorphism'>('theme');
  
  // Full screen toggle handler
  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };
  
  // DEBUG: Immediate logging to verify component initialization
  // console.log('🔧 SCROLL LOCK DEBUG: Component initialized, isScrollLocked:', isScrollLocked);
  
  // Performance tracking for processing states
  useEffect(() => {
    if (isProcessing) {
      performanceTracker.trackMetric('processing_started', {
        timestamp: Date.now(),
        inputSizes: {
          original: originalText.length,
          revised: revisedText.length
        }
      });
    }
  }, [isProcessing, originalText.length, revisedText.length, performanceTracker]);
  
  // Track comparison completion and results
  useEffect(() => {
    if (result && !isProcessing) {
      performanceTracker.trackMetric('comparison_completed', {
        timestamp: Date.now(),
        resultSize: {
          changes: result.changes?.length || 0,
          totalCharacters: result.changes?.reduce((sum, change) => sum + (change.content?.length || 0), 0) || 0
        },
        chunkingEnabled: chunkingProgress.enabled
      });
      
      // Auto-save completed comparisons to RdLn Memory (if content is substantial)
      const totalContent = (originalText?.length || 0) + (revisedText?.length || 0);
      if (totalContent > 50) { // Only save if there's meaningful content
        saveSession(originalText, revisedText, true); // true = has result
        console.log('🎯 Auto-saved comparison to RdLn Memory');
      }
    }
  }, [result, isProcessing, chunkingProgress.enabled, performanceTracker, originalText, revisedText, saveSession]);
  
  // Track memory usage periodically during processing
  useEffect(() => {
    if (!isProcessing || !performanceTracker.isEnabled) return;
    
    const memoryInterval = setInterval(() => {
      const memoryInfo = (performance as any)?.memory;
      if (memoryInfo) {
        performanceTracker.trackMetric('memory_usage', {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit
        });
      }
    }, 1000); // Track every second during processing
    
    return () => clearInterval(memoryInterval);
  }, [isProcessing, performanceTracker]);
  
  // SSMR STEP 6: Extracted scroll sync logic into custom hook
  const { updateScrollRefs } = useScrollSync({
    isScrollLocked,
    outputRef: redlineOutputRef
  });
  
  // SSMR STEP 6: Scroll sync logic now handled by useScrollSync hook
  // Test element detection when scroll lock state changes (safe testing)
  // TIMING FIX: Also update when result changes so scroll lock works if already on before output
  useEffect(() => {
    if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) console.log('🔧 SCROLL LOCK DEBUG: useEffect triggered - updating refs. Triggers:', {
      isScrollLocked,
      hasResult: !!result,
      resultChanges: result?.changes?.length || 0
    });
    // Only run element detection for testing purposes (no event listeners yet)
    updateScrollRefs();
  }, [isScrollLocked, updateScrollRefs, result]);
  
  // SSMR FIX: CSS-based resize to prevent React re-renders
  // SAFE: Fallback to React state if CSS manipulation fails
  // MODULAR: Can be disabled by setting USE_CSS_RESIZE = false
  // REVERSIBLE: Easy rollback to React state
  const USE_CSS_RESIZE = true; // ROLLBACK: Set to false to use React state
  
  const { isMobile, getPanelVisibility } = useMobileTabInterface();

  // SSMR STEP 5: Extracted resize logic into custom hook
  const {
    panelResizeHandlers,
    outputResizeHandlers,
    panelHeight,
    outputHeight,
    setOutputHeightCSS
  } = useResizeHandlers({
    USE_CSS_RESIZE,
    minHeight: 200,
    minOutputHeight: 300,
    isMobile
  });

  
  // Local refs for resize handles (not managed by hook)
  const desktopResizeHandleRef = useRef<HTMLDivElement>(null);
  const mobileResizeHandleRef = useRef<HTMLDivElement>(null);
  
  
  // FIX: Apply output height CSS constraint when result changes
  useEffect(() => {
    if (result && USE_CSS_RESIZE) {
      // Apply proper height constraint after new comparison result
      // Use setTimeout to ensure DOM is ready after component renders
      setTimeout(() => {
        setOutputHeightCSS(500); // Reset to default constrained height
      }, 10);
    }
  }, [result, USE_CSS_RESIZE, setOutputHeightCSS]);

  // Get experimental features (moved here before useEffect that depends on it)
  const { features } = useExperimentalFeatures();
  
  // Enable keyboard shortcut for dev dashboard
  const experimentalCSSClasses = useExperimentalCSSClasses();
  
  // Jump to results functionality for experimental features
  const { jumpToResults } = useJumpToResults();
  
  // Results overlay hook - only active when feature is enabled (moved here before useEffect)
  const {
    isVisible: overlayVisible,
    showOverlay,
    hideOverlay,
    forceHideOverlay
  } = useResultsOverlay(
    !!result, 
    isProcessing, 
    {
      autoShow: features.resultsOverlay,
      onShow: onOverlayShow,
      onHide: onOverlayHide
    }
  );

  // Performance-aware handlers - Define BEFORE useEffect that references them
  const handleSwapContent = usePerformanceAwareHandler(() => {
    const tempOriginal = originalText;
    setOriginalText(revisedText);
    setRevisedText(tempOriginal);
    
    // Track swap metrics
    performanceTracker.trackMetric('content_swap', {
      originalLength: originalText.length,
      revisedLength: revisedText.length
    });
  }, 'swap_content', performanceTracker);

  // Clear content with undo protection
  const handleResetComparison = usePerformanceAwareHandler(() => {
    // Only save state if there's actually content to save
    if (originalText.trim() || revisedText.trim()) {
      saveClearState(originalText, revisedText);
    }
    
    resetComparison();
    
    // Track reset metrics
    performanceTracker.trackMetric('comparison_reset', {
      hadContent: !!(originalText.trim() || revisedText.trim()),
      hadResults: !!result
    });
  }, 'reset_comparison', performanceTracker);

  // Undo clear action
  const handleUndo = usePerformanceAwareHandler(() => {
    const clearedState = undoClear();
    if (clearedState) {
      setOriginalText(clearedState.originalText);
      setRevisedText(clearedState.revisedText);
      // Results are not restored - user needs to re-compare if needed
    }
  }, 'undo_clear', performanceTracker);

  // RdLn Memory handlers
  const handleSaveSession = usePerformanceAwareHandler(() => {
    const sessionId = saveSession(originalText, revisedText, !!result);
    console.log('💾 Session saved to RdLn Memory:', sessionId);
  }, 'save_session', performanceTracker);

  const handleLoadSession = usePerformanceAwareHandler((sessionId: string) => {
    const session = loadSession(sessionId);
    if (session) {
      setOriginalText(session.originalText);
      setRevisedText(session.revisedText);
      // Clear any existing results since we're loading new content
      resetComparison();
      console.log('📖 Session loaded from RdLn Memory:', session.sessionName);
    }
  }, 'load_session', performanceTracker);

  const handleDeleteSession = usePerformanceAwareHandler((sessionId: string) => {
    deleteSession(sessionId);
    console.log('🗑️ Session deleted from RdLn Memory:', sessionId);
  }, 'delete_session', performanceTracker);

  const handleClearAllSessions = usePerformanceAwareHandler(() => {
    clearAllSessions();
    console.log('🧹 All sessions cleared from RdLn Memory');
  }, 'clear_all_sessions', performanceTracker);

  const handleExportSessions = usePerformanceAwareHandler(() => {
    const jsonData = exportSessions();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdln-memory-sessions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('📤 Sessions exported from RdLn Memory');
  }, 'export_sessions', performanceTracker);

  const handleImportSessions = usePerformanceAwareHandler((jsonData: string) => {
    const success = importSessions(jsonData);
    if (success) {
      console.log('📥 Sessions imported to RdLn Memory');
    } else {
      console.error('❌ Failed to import sessions');
    }
  }, 'import_sessions', performanceTracker);


  // Keyboard shortcuts and global cancellation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Global ESC key cancellation - but check overlay first
        if (e.key === 'Escape') {
          // If overlay is visible, let it handle the ESC key
          if (features.resultsOverlay && overlayVisible) {
            return; // Let overlay handle ESC
          }
          
          e.preventDefault();
          e.stopPropagation();
          if (isProcessing && !isCancelling) {
            cancelComparison();
          }
          return;
        }
      
      // Alt+Enter comparison shortcut
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        compareDocuments();
      }
      
      // Alt+L toggle live compare
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        toggleQuickCompare();
      }
      
      // Alt+W swap content
      if (e.altKey && e.key === 'w') {
        e.preventDefault();
        handleSwapContent();
      }
      
      // Alt+D toggle scroll lock
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        setIsScrollLocked(!isScrollLocked);
      }
      
      // Alt+Delete clear/reset (no confirmation - lightning-fast UX)
      if (e.altKey && e.key === 'Delete') {
        e.preventDefault();
        handleResetComparison();
      }
      
      
      // Ctrl+Z undo clear (simple protection against accidental clears)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        const target = e.target as HTMLElement;
        const isTextarea = target?.tagName === 'TEXTAREA';
        const isInput = target?.tagName === 'INPUT';
        
        // If we have a cleared state to restore, use our undo
        if (canUndo) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleUndo();
        } else if (isTextarea || isInput) {
          // Let browser handle textarea/input undo if no app-level undo available
          // (This allows normal text editing undo within the textareas)
        } else {
          // Prevent default if not in a text field and no undo available
          e.preventDefault();
        }
      }
      
      // Alt+M RdLn Memory quick save
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        const totalContent = (originalText?.length || 0) + (revisedText?.length || 0);
        if (totalContent > 0) {
          handleSaveSession();
          console.log('💾 Quick save to RdLn Memory via Alt+M');
        }
      }
    };

    // Use capture phase with additional options to ensure Ctrl+Z works regardless of focus
    const eventOptions = { capture: true, passive: false };
    window.addEventListener('keydown', handleKeyDown, eventOptions);
    
    // Also add to document for extra coverage
    document.addEventListener('keydown', handleKeyDown, eventOptions);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, eventOptions);
      document.removeEventListener('keydown', handleKeyDown, eventOptions);
    };
  }, [compareDocuments, isProcessing, isCancelling, cancelComparison, features.resultsOverlay, overlayVisible, toggleQuickCompare, handleSwapContent, isScrollLocked, setIsScrollLocked, handleResetComparison, canUndo, handleUndo, originalText, revisedText, handleSaveSession]);

  const handleLoadTest = usePerformanceAwareHandler(async (originalText: string, revisedText: string) => {
    // Track load test operation
    await performanceTracker.trackOperation('load_test', async () => {
      // SSMR: Clear inputs first to prevent persistence issues
      setOriginalText('');
      setRevisedText('');
      
      // Cancel any ongoing operations
      if (isProcessing) {
        cancelComparison();
      }
      
      // Use setTimeout to ensure state is cleared before loading new content
      await new Promise(resolve => {
        setTimeout(() => {
          setOriginalText(originalText);
          setRevisedText(revisedText);
          
          // Auto-compare if enabled - use manual operation flag to ensure cancellation works
          if (quickCompareEnabled) {
            setTimeout(() => {
              compareDocuments(false, true, originalText, revisedText);
            }, 200);
          }
          resolve(undefined);
        }, 100);
      });
      
      // Track metrics
      performanceTracker.trackMetric('load_test_size', {
        originalLength: originalText.length,
        revisedLength: revisedText.length,
        totalLength: originalText.length + revisedText.length
      });
    });
  }, 'load_test', performanceTracker);
  
  // SSMR STEP 5: Mouse handlers now provided by useResizeHandlers hook

  // Auto-scroll to output panel when it appears (Feature #2)
  useEffect(() => {
    if (features.autoScrollToResults) {
      // Only scroll when processing starts, not when results complete
      // (user is already positioned at output area from the first scroll)
      if (isProcessing) {
        // Wait for DOM to update, then scroll to output section
        setTimeout(() => {
          // Try to find the output section first, then fallback to data-output-panel
          const outputSection = document.querySelector('.output-section');
          const outputPanel = document.querySelector('[data-output-panel]');
          const targetElement = outputSection || outputPanel;
          
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',  // Center in viewport for better continuity
              inline: 'nearest'
            });
            
            if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🎯 Auto-scrolled to output section (processing started) - Feature #2');
          }
        }, 100);
      }
    }
  }, [features.autoScrollToResults, isProcessing]); // Removed 'result' from dependencies
  
  // Results spotlight animation (Feature #1)
  useEffect(() => {
    if (features.resultsSpotlight && result && !isProcessing) {
      // Wait for DOM to update, then trigger spotlight animation
      setTimeout(() => {
        const outputPanel = document.querySelector('[data-output-panel]');
        if (outputPanel) {
          // Add spotlight animation class
          outputPanel.classList.add('results-appearing');
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('✨ Results spotlight activated (Feature #1) - 3s persist + 3s fade');
          
          // Remove animation class after 6 seconds (3s persist + 3s fade)
          setTimeout(() => {
            outputPanel.classList.remove('results-appearing');
          }, 6000);
        }
      }, 50); // Slightly faster than auto-scroll for immediate visual feedback
    }
  }, [features.resultsSpotlight, result, isProcessing]);
  
  // Results First Animation (Feature #9) - Enhanced with proper cleanup and diagnostics
  useEffect(() => {
    const container = document.querySelector('.comparison-interface-container');
    
    if (!container) {
      console.error('🔧 FEATURE #9 ERROR: Container .comparison-interface-container not found');
      return;
    }

    if (features.resultsFirstAnimation && result && !isProcessing) {
      // Wait for DOM to update, then trigger position swap animation
      setTimeout(() => {
        // DIAGNOSTIC: Check current classes and DOM structure
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 FEATURE #9 DIAGNOSTIC: Activating animation');
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 Current container classes:', container.className);
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 Input section exists:', !!container.querySelector('.input-section'));
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 Output section exists:', !!container.querySelector('.output-section'));
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 Has experimental-results-first class:', container.classList.contains('experimental-results-first'));
        
        // Ensure we have the base experimental class
        if (!container.classList.contains('experimental-results-first')) {
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.warn('🔧 FEATURE #9 WARNING: Missing experimental-results-first class, animation may not work properly');
        }
        
        // Add results-active class to trigger CSS animations
        container.classList.add('results-active');
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔄 Results First Animation activated (Feature #9) - Seamless position swap');
        if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 Container classes after adding results-active:', container.className);
        
        // Verify the animation elements exist
        const inputSection = container.querySelector('.input-section');
        const outputSection = container.querySelector('.output-section');
        
        if (inputSection && outputSection) {
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('✅ FEATURE #9: Animation elements found, transition should be smooth');
        } else {
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.error('❌ FEATURE #9: Missing animation elements', {
            inputSection: !!inputSection,
            outputSection: !!outputSection
          });
        }
      }, 100); // Slightly longer delay to ensure DOM is fully ready
    } else {
      // Remove animation class when feature is disabled or no results
      if (container.classList.contains('results-active')) {
        container.classList.remove('results-active');
        
        if (!features.resultsFirstAnimation && result) {
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 FEATURE #9: Removed results-active class (feature disabled)');
        } else if (!result) {
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🔧 FEATURE #9: Removed results-active class (no results)');
        }
      }
    }
  }, [features.resultsFirstAnimation, result, isProcessing]);
  
  // Refined Results First Animation (Feature #10)
  useEffect(() => {
    if (features.refinedResultsFirst && result && !isProcessing) {
      // Wait for DOM to update, then trigger complex animation sequence
      setTimeout(() => {
        const outputPanel = document.querySelector('[data-output-panel]');
        if (outputPanel) {
          // Add transition animation class
          outputPanel.classList.add('results-overlay-transition');
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🎭 Refined Results First Animation activated (Feature #10) - 2s overlay then animate to top');
          
          // Remove animation class after 3 seconds (animation duration)
          setTimeout(() => {
            outputPanel.classList.remove('results-overlay-transition');
          }, 3000);
        }
      }, 50);
    } else if (!result) {
      // Remove animation class when results are cleared
      const outputPanel = document.querySelector('[data-output-panel]');
      if (outputPanel) {
        outputPanel.classList.remove('results-overlay-transition');
      }
    }
  }, [features.refinedResultsFirst, result, isProcessing]);
  
  return (
    <div className={`comparison-interface-container ${experimentalCSSClasses}`}>
      {/* Test Suite - DISABLED FOR PRODUCTION */}
      {/* <TestSuite onLoadTest={handleLoadTest} /> */}

      {/* Advanced Test Suite - Segregated Testing Module - DISABLED FOR PRODUCTION */}
      {/* <AdvancedTestSuite onLoadTest={handleLoadTest} /> */}

      {/* Extreme Test Suite - Ultra-Complex Testing Module - Toggleable via Dev Dashboard */}
      {showExtremeTestSuite && <ExtremeTestSuite onLoadTest={handleLoadTest} />}

      {/* STEP 3b: Background Loading Status - Removed to be placed in App.tsx */}
      
      {/* SSMR CHUNKING: Progress now shown in output area during processing */}
      
      
      {/* Demo Performance Test Buttons */}
      <PerformanceDemoCard 
        visible={showPerformanceDemoCard}
        onLoadTest={handleLoadTest}
      />

      {/* Mobile Tab Interface - Experimental Feature #6 */}
      <MobileTabInterface
        isVisible={true}
        hasResults={!!result}
      />
      
      {/* Input Section with Centered Swap Button - Enhanced with glassmorphism */}
      <div className="input-section relative mb-8" style={{ display: getPanelVisibility('input') }}>
        {/* Desktop Input Layout Component */}
        <DesktopInputLayout
          originalText={originalText}
          revisedText={revisedText}
          isProcessing={isProcessing}
          panelHeight={panelHeight}
          USE_CSS_RESIZE={USE_CSS_RESIZE}
          onOriginalTextChange={(value: string, isPasteAction?: boolean) => setOriginalText(value, isPasteAction)}
          onRevisedTextChange={(value: string, isPasteAction?: boolean) => setRevisedText(value, isPasteAction)}
          panelResizeHandlers={panelResizeHandlers}
          desktopResizeHandleRef={desktopResizeHandleRef}
        />
        
        {/* Mobile Input Layout Component */}
        <MobileInputLayout
          originalText={originalText}
          revisedText={revisedText}
          isProcessing={isProcessing}
          panelHeight={panelHeight}
          USE_CSS_RESIZE={USE_CSS_RESIZE}
          onOriginalTextChange={(value: string, isPasteAction?: boolean) => setOriginalText(value, isPasteAction)}
          onRevisedTextChange={(value: string, isPasteAction?: boolean) => setRevisedText(value, isPasteAction)}
          panelResizeHandlers={panelResizeHandlers}
          mobileResizeHandleRef={mobileResizeHandleRef}
        />


        {/* Consolidated Vertical Controls Panel - Centered between input panels */}
        <DesktopControlsPanel
          quickCompareEnabled={quickCompareEnabled}
          isScrollLocked={isScrollLocked}
          systemProtectionEnabled={systemProtectionEnabled}
          isProcessing={isProcessing}
          originalText={originalText}
          revisedText={revisedText}
          onCompare={() => compareDocuments()}
          onToggleQuickCompare={toggleQuickCompare}
          onSwapContent={handleSwapContent}
          onToggleScrollLock={() => {
            if (DEV_CONFIG.DEBUGGING.SCROLL_SYNC_DEBUG) console.log('🔧 SCROLL LOCK DEBUG: Button clicked, toggling from', isScrollLocked, 'to', !isScrollLocked);
            setIsScrollLocked(!isScrollLocked);
          }}
          onToggleSystemProtection={toggleSystemProtection}
          onResetComparison={handleResetComparison}
          canUndo={canUndo}
          onUndo={handleUndo}
          contentLength={originalText.length + revisedText.length}
          // RdLn Memory props
          hasSessions={hasSessions}
          sessionCount={sessions.length}
          isLoadingMemory={isLoadingMemory}
          onSaveSession={handleSaveSession}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAllSessions}
          onExport={handleExportSessions}
          onImport={handleImportSessions}
        />

        {/* Mobile Controls - Enhanced with all operation buttons */}
        <MobileControlsPanel
          quickCompareEnabled={quickCompareEnabled}
          isScrollLocked={isScrollLocked}
          isProcessing={isProcessing}
          originalText={originalText}
          revisedText={revisedText}
          onCompare={() => compareDocuments()}
          onToggleQuickCompare={toggleQuickCompare}
          onSwapContent={handleSwapContent}
          onToggleScrollLock={() => setIsScrollLocked(!isScrollLocked)}
          onResetComparison={handleResetComparison}
          canUndo={canUndo}
          onUndo={handleUndo}
          contentLength={originalText.length + revisedText.length}
          // RdLn Memory props
          hasSessions={hasSessions}
          sessionCount={sessions.length}
          isLoadingMemory={isLoadingMemory}
          onSaveSession={handleSaveSession}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAllSessions}
          onExport={handleExportSessions}
          onImport={handleImportSessions}
        />
      </div>


      {/* Error and Success Messages */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      


      
      {(result || isProcessing) && (
        <div className="output-section" style={{ display: getPanelVisibility('output') }}>
          {isProcessing && (
            <ProcessingDisplay 
              chunkingProgress={chunkingProgress} 
              isCancelling={isCancelling} 
              onCancel={cancelComparison} 
            />
          )}
          {result && !isProcessing && (
            features.stickyResultsPanel ? (
              <StickyResultsPanel
                isVisible={true}
                hasResults={!!result}
                onTogglePin={(isPinned) => { if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🧪 Sticky Results Panel: Pin toggled', isPinned); }}
                onToggleMinimize={(isMinimized) => { if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🧪 Sticky Results Panel: Minimize toggled', isMinimized); }}
              >
                <OutputLayout
                  changes={result.changes}
                  stats={result.stats}
                  USE_CSS_RESIZE={USE_CSS_RESIZE}
                  outputHeight={outputHeight}
                  onCopy={() => {}}
                  outputResizeHandlers={outputResizeHandlers}
                  scrollRef={redlineOutputRef}
                  onShowOverlay={showOverlay}
                  isInOverlayMode={false}
                  onToggleFullScreen={toggleFullScreen}
                  isFullScreen={isFullScreen}
                />
              </StickyResultsPanel>
            ) : (
              <OutputLayout
                changes={result.changes}
                stats={result.stats}
                USE_CSS_RESIZE={USE_CSS_RESIZE}
                outputHeight={outputHeight}
                onCopy={() => {}}
                outputResizeHandlers={outputResizeHandlers}
                scrollRef={redlineOutputRef}
                onShowOverlay={showOverlay}
                isInOverlayMode={false}
                onToggleFullScreen={toggleFullScreen}
                isFullScreen={isFullScreen}
              />
            )
          )}
        </div>
      )}
      
      {/* Experimental Features */}
      {features.floatingJumpButton && (
        <FloatingJumpButton
          isVisible={features.floatingJumpButton}
          onJumpToResults={jumpToResults}
          hasResults={!!result}
        />
      )}
      
      
      {/* Results Overlay - Feature #8 */}
      {features.resultsOverlay && result && (
        <ResultsOverlay
          isVisible={overlayVisible}
          onClose={hideOverlay}
          onForceClose={forceHideOverlay}
        >
          <RedlineOutput
            changes={result.changes}
            onCopy={() => {}}
            height={9999} // Full height in overlay
            isProcessing={false}
            processingStatus=""
            scrollRef={redlineOutputRef}
            onShowOverlay={hideOverlay} // Convert to close overlay function
            isInOverlayMode={true} // Enable overlay mode styling
            hideHeader={false} // Show header with controls in overlay
            onBackgroundModeChange={(mode) => {
              // Update overlay class based on background mode
              const overlayElement = document.querySelector('.experimental-results-overlay');
              if (overlayElement) {
                if (mode === 'glassmorphism') {
                  overlayElement.classList.add('glassmorphism-mode');
                } else {
                  overlayElement.classList.remove('glassmorphism-mode');
                }
              }
              if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) console.log('🎯 Background mode changed:', mode);
            }}
          />
        </ResultsOverlay>
      )}

      {/* Full Screen Overlay - Full screen version of OutputLayout */}
      <FullScreenOverlay
        isVisible={isFullScreen}
        onClose={toggleFullScreen}
        className={fullScreenBackgroundMode === 'glassmorphism' ? 'glassmorphism-mode' : ''}
      >
        {result && (
          <div className="w-full h-full">
            {/* Full screen version - no margins or padding */}
            <div className="h-full flex flex-col">
              <div data-output-panel className="flex-1">
                <RedlineOutput
                  changes={result.changes} 
                  onCopy={() => {}}
                  height={window.innerHeight}
                  isProcessing={false}
                  processingStatus=""
                  scrollRef={redlineOutputRef}
                  onShowOverlay={toggleFullScreen}
                  isInOverlayMode={true}
                  hideHeader={false}
                  onToggleFullScreen={toggleFullScreen}
                  isFullScreen={true}
                  backgroundMode={fullScreenBackgroundMode}
                  onBackgroundModeChange={(mode) => setFullScreenBackgroundMode(mode)}
                />
              </div>
            </div>
          </div>
        )}
      </FullScreenOverlay>

    </div>
  );
});

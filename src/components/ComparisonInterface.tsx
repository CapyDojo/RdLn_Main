import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, CheckCircle, GripHorizontal } from 'lucide-react';
import { useComparison } from '../hooks/useComparison';
import { TextInputPanel } from './TextInputPanel';
import { RedlineOutput } from './RedlineOutput';
import { ProcessingDisplay } from './ProcessingDisplay';
import { OutputLayout } from './OutputLayout';
import { ComparisonStats } from './ComparisonStats';
import { PerformanceDemoCard } from './PerformanceDemoCard';
import { DesktopControlsPanel } from './DesktopControlsPanel';
import { MobileControlsPanel } from './MobileControlsPanel';
import { DesktopInputLayout } from './DesktopInputLayout';
import { MobileInputLayout } from './MobileInputLayout';
import { ExtremeTestSuite } from '../testing/ExtremeTestSuite';
// Resize and scroll handlers
import { useResizeHandlers } from '../hooks/useResizeHandlers';
import { useScrollSync } from '../hooks/useScrollSync';
// Performance monitoring
import { useComponentPerformance, usePerformanceAwareHandler } from '../utils/performanceUtils.tsx';
// Experimental features
import { useExperimentalFeatures, useExperimentalCSSClasses } from '../contexts/ExperimentalLayoutContext';
import { FloatingJumpButton } from './experimental/FloatingJumpButton';
import { MobileTabInterface } from './experimental/MobileTabInterface';
import { StickyResultsPanel } from './experimental/StickyResultsPanel';
import { ResultsOverlay } from './experimental/ResultsOverlay';
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
}

export const ComparisonInterface: React.FC<ComparisonInterfaceProps> = ({
  showAdvancedOcrCard = true,
  showPerformanceDemoCard = true,
  showExtremeTestSuite = false,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo,
  onToggleExtremeTestSuite,
  onOverlayShow,
  onOverlayHide,
  style,
  className,
  ...props
}) => {
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
  
  

  const redlineOutputRef = useRef<HTMLDivElement>(null);

  const [copySuccess, setCopySuccess] = React.useState(false);
  
  // SSMR Step 1: Scroll lock state (Safe - no functionality yet)
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  
  // DEBUG: Immediate logging to verify component initialization
  console.log('🔧 SCROLL LOCK DEBUG: Component initialized, isScrollLocked:', isScrollLocked);
  
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
    }
  }, [result, isProcessing, chunkingProgress.enabled, performanceTracker]);
  
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
  const {
    scrollRefs,
    updateScrollRefs,
    syncScroll
  } = useScrollSync({
    isScrollLocked,
    outputRef: redlineOutputRef
  });
  
  // SSMR STEP 6: Scroll sync logic now handled by useScrollSync hook
  // Test element detection when scroll lock state changes (safe testing)
  // TIMING FIX: Also update when result changes so scroll lock works if already on before output
  useEffect(() => {
    console.log('🔧 SCROLL LOCK DEBUG: useEffect triggered - updating refs. Triggers:', {
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
      
      // Ctrl+Enter comparison shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        compareDocuments();
      }
    };

    // Use capture phase for ESC to ensure it works regardless of focus
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [compareDocuments, isProcessing, isCancelling, cancelComparison, features.resultsOverlay, overlayVisible]);

  // Performance-aware handlers
  const handleCopy = usePerformanceAwareHandler(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, 'copy_output', performanceTracker);

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
            
            console.log('🎯 Auto-scrolled to output section (processing started) - Feature #2');
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
          console.log('✨ Results spotlight activated (Feature #1) - 3s persist + 3s fade');
          
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
        console.log('🔧 FEATURE #9 DIAGNOSTIC: Activating animation');
        console.log('🔧 Current container classes:', container.className);
        console.log('🔧 Input section exists:', !!container.querySelector('.input-section'));
        console.log('🔧 Output section exists:', !!container.querySelector('.output-section'));
        console.log('🔧 Has experimental-results-first class:', container.classList.contains('experimental-results-first'));
        
        // Ensure we have the base experimental class
        if (!container.classList.contains('experimental-results-first')) {
          console.warn('🔧 FEATURE #9 WARNING: Missing experimental-results-first class, animation may not work properly');
        }
        
        // Add results-active class to trigger CSS animations
        container.classList.add('results-active');
        console.log('🔄 Results First Animation activated (Feature #9) - Seamless position swap');
        console.log('🔧 Container classes after adding results-active:', container.className);
        
        // Verify the animation elements exist
        const inputSection = container.querySelector('.input-section');
        const outputSection = container.querySelector('.output-section');
        
        if (inputSection && outputSection) {
          console.log('✅ FEATURE #9: Animation elements found, transition should be smooth');
        } else {
          console.error('❌ FEATURE #9: Missing animation elements', {
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
          console.log('🔧 FEATURE #9: Removed results-active class (feature disabled)');
        } else if (!result) {
          console.log('🔧 FEATURE #9: Removed results-active class (no results)');
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
          console.log('🎭 Refined Results First Animation activated (Feature #10) - 2s overlay then animate to top');
          
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
            console.log('🔧 SCROLL LOCK DEBUG: Button clicked, toggling from', isScrollLocked, 'to', !isScrollLocked);
            setIsScrollLocked(!isScrollLocked);
          }}
          onToggleSystemProtection={toggleSystemProtection}
          onResetComparison={resetComparison}
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
          onResetComparison={resetComparison}
        />
      </div>


      {/* Error and Success Messages */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {copySuccess && (
        <div className="mt-3 flex items-center gap-2 text-theme-secondary-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Redlined text copied to clipboard!
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
                onTogglePin={(isPinned) => console.log('🧪 Sticky Results Panel: Pin toggled', isPinned)}
                onToggleMinimize={(isMinimized) => console.log('🧪 Sticky Results Panel: Minimize toggled', isMinimized)}
              >
                <OutputLayout
                  changes={result.changes}
                  stats={result.stats}
                  USE_CSS_RESIZE={USE_CSS_RESIZE}
                  outputHeight={outputHeight}
                  onCopy={handleCopy}
                  outputResizeHandlers={outputResizeHandlers}
                  scrollRef={redlineOutputRef}
                  onShowOverlay={showOverlay}
                  isInOverlayMode={false}
                />
              </StickyResultsPanel>
            ) : (
              <OutputLayout
                changes={result.changes}
                stats={result.stats}
                USE_CSS_RESIZE={USE_CSS_RESIZE}
                outputHeight={outputHeight}
                onCopy={handleCopy}
                outputResizeHandlers={outputResizeHandlers}
                scrollRef={redlineOutputRef}
                onShowOverlay={showOverlay}
                isInOverlayMode={false}
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
            onCopy={handleCopy}
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
              console.log('🎯 Background mode changed:', mode);
            }}
          />
        </ResultsOverlay>
      )}

    </div>
  );
};

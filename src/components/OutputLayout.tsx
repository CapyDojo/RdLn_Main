import React, { useEffect, useState } from 'react';
import { GripHorizontal } from 'lucide-react';
import { RedlineOutput } from './RedlineOutput';
import { ComparisonStats } from './ComparisonStats';
import { DiffChange, ComparisonStats as ComparisonStatsType } from '../types';
import { BaseComponentProps } from '../types/components';
import { getTextMetrics, TextMetrics } from '../utils/textMetrics';

interface OutputLayoutProps extends BaseComponentProps {
  /** Comparison result changes */
  changes: DiffChange[];
  /** Comparison statistics */
  stats: ComparisonStatsType;
  /** Whether to use CSS-based resize */
  USE_CSS_RESIZE: boolean;
  /** Output height for fallback React state */
  outputHeight: number;
  /** Callback for copy action */
  onCopy: () => void;
  /** Output resize handlers from hook */
  outputResizeHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    outputResizeHandleRef: React.RefObject<HTMLDivElement>;
  };
  /** Scroll ref for RedlineOutput */
  scrollRef: React.RefObject<HTMLDivElement>;
  /** Callback for showing results overlay */
  onShowOverlay?: () => void;
  /** Whether we're currently in overlay mode */
  isInOverlayMode?: boolean;
  /** Whether to hide the header */
  hideHeader?: boolean;
  /** Callback for toggling full screen mode */
  onToggleFullScreen?: () => void;
  /** Whether currently in full screen mode */
  isFullScreen?: boolean;
  /** Optional callback for auto-height adjustment */
  onHeightChangeRequest?: (height: number) => void;
  /** Callback to provide calculated stats from output content */
  onStatsCalculated?: (stats: ComparisonStatsType) => void;
}

/**
 * Output Layout Component
 * 
 * Handles the display of comparison results with resize handle.
 * Extracted from ComparisonInterface for better modularity and performance.
 * 
 * Features:
 * - RedlineOutput display with scroll integration
 * - ComparisonStats display
 * - Output resize handle with hover effects
 * - Visual legend for additions/deletions
 * - Real-time output content metrics (character and word counts)
 * - Comprehensive stats calculation based on actual rendered content
 * - Stats synchronization with ComparisonStats component
 */
export const OutputLayout: React.FC<OutputLayoutProps> = ({
  changes,
  stats,
  USE_CSS_RESIZE,
  outputHeight,
  onCopy,
  outputResizeHandlers,
  scrollRef,
  onShowOverlay,
  isInOverlayMode = false,
  hideHeader = false,
  onToggleFullScreen,
  isFullScreen = false,
  onHeightChangeRequest,
  onStatsCalculated,
  style,
  className
}) => {
  const [outputMetrics, setOutputMetrics] = useState<TextMetrics>({ characters: 0, words: 0 });

  // Extract text content from the output panel and calculate comprehensive metrics
  useEffect(() => {
    const updateMetrics = () => {
      const outputPanel = document.querySelector('[data-output-panel]');
      if (outputPanel) {
        // Get the text content from all content divs within the output panel
        const contentElements = outputPanel.querySelectorAll('.chunk-container');
        let totalText = '';
        
        // Also calculate detailed stats by analyzing the styled spans
        let addedWords = 0;
        let deletedWords = 0;
        let unchangedWords = 0;
        let addedCharacters = 0;
        let deletedCharacters = 0;
        let unchangedCharacters = 0;
        
        contentElements.forEach(element => {
          const textContent = element.textContent || '';
          totalText += textContent;
          
          // Count additions (green spans)
          const addedSpans = element.querySelectorAll('span[style*="background: linear-gradient(135deg, #f0fdf4"]');
          addedSpans.forEach(span => {
            const text = span.textContent || '';
            const spanMetrics = getTextMetrics(text);
            addedWords += spanMetrics.words;
            addedCharacters += spanMetrics.characters;
          });
          
          // Count deletions (red spans)
          const deletedSpans = element.querySelectorAll('span[style*="background: linear-gradient(135deg, #fef7f7"]');
          deletedSpans.forEach(span => {
            const text = span.textContent || '';
            const spanMetrics = getTextMetrics(text);
            deletedWords += spanMetrics.words;
            deletedCharacters += spanMetrics.characters;
          });
        });
        
        const totalMetrics = getTextMetrics(totalText);
        setOutputMetrics(totalMetrics);
        
        // Calculate unchanged content (total - added - deleted)
        unchangedWords = Math.max(0, totalMetrics.words - addedWords - deletedWords);
        unchangedCharacters = Math.max(0, totalMetrics.characters - addedCharacters - deletedCharacters);
        
        // Calculate comprehensive stats and pass back to parent
        if (onStatsCalculated) {
          const comprehensiveStats: ComparisonStatsType = {
            additions: addedWords > 0 ? Math.ceil(addedWords / 10) : 0, // Rough block estimate
            deletions: deletedWords > 0 ? Math.ceil(deletedWords / 10) : 0, // Rough block estimate  
            unchanged: unchangedWords > 0 ? Math.ceil(unchangedWords / 10) : 0, // Rough block estimate
            totalChanges: addedWords + deletedWords,
            wordStats: {
              addedWords,
              deletedWords,
              unchangedWords,
              totalWords: totalMetrics.words,
              reviewWorkload: addedWords + deletedWords,
              percentageChanged: totalMetrics.words > 0 ? Math.round(((addedWords + deletedWords) / totalMetrics.words) * 1000) / 10 : 0
            },
            characterStats: {
              addedCharacters,
              deletedCharacters,
              unchangedCharacters,
              totalCharacters: totalMetrics.characters,
              totalCharactersNoSpaces: totalMetrics.characters, // Simplified for now
              reviewWorkload: addedCharacters + deletedCharacters,
              percentageChanged: totalMetrics.characters > 0 ? Math.round(((addedCharacters + deletedCharacters) / totalMetrics.characters) * 1000) / 10 : 0
            }
          };
          onStatsCalculated(comprehensiveStats);
        }
      }
    };

    // Update metrics initially and whenever changes occur
    updateMetrics();
    
    // Set up a mutation observer to watch for content changes
    const outputPanel = document.querySelector('[data-output-panel]');
    if (outputPanel) {
      const observer = new MutationObserver(() => {
        updateMetrics();
      });
      
      observer.observe(outputPanel, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      return () => observer.disconnect();
    }
  }, [changes]); // Re-run when changes prop updates
  return (
    <div className={`mb-6 ${className || ''}`} style={style}> {/* Match input panel structure for natural expansion */}
      {/* SSMR: Direct RedlineOutput with proper container identity */}
      <div data-output-panel>
        <RedlineOutput
          changes={changes} 
          onCopy={onCopy}
          height={USE_CSS_RESIZE ? 9999 : outputHeight} // Height controlled by inner-content CSS
          isProcessing={false}
          processingStatus=""
          scrollRef={scrollRef}
          onShowOverlay={onShowOverlay}
          isInOverlayMode={isInOverlayMode}
          hideHeader={hideHeader}
          onToggleFullScreen={onToggleFullScreen}
          isFullScreen={isFullScreen}
          onHeightChangeRequest={onHeightChangeRequest}
        />
      </div>
      
      {/* Output Resize Handle - Positioned at bottom center of output */}
      <div className="flex justify-center">
        <div
          data-resize-handle="output-panel"
          data-testid="output-resize-handle"
          ref={outputResizeHandlers.outputResizeHandleRef}
          className="glass-panel output-resize-handle relative flex items-center w-full max-w-2xl h-10 cursor-row-resize touch-none select-none backdrop-blur-md px-4"
          onMouseDown={outputResizeHandlers.handleMouseDown}
          onMouseEnter={() => {
            // Apply hover effects to output panel - same as handle bar
            const outputPanels = document.querySelectorAll('[data-output-panel] .glass-panel');
            outputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              // Apply same hover state as the handle bar
              element.classList.add('hover-from-handle');
              element.style.transform = 'translateY(-1px)';
              element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
            });
          }}
          onMouseLeave={() => {
            // Remove hover effects from output panel
            const outputPanels = document.querySelectorAll('[data-output-panel] .glass-panel');
            outputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              element.classList.remove('hover-from-handle');
              element.style.transform = '';
            });
          }}
          title="Drag to resize output panel"
        >
          <div className="flex justify-between items-center w-full text-xs text-theme-primary-700">
            {/* Left: Visual legend */}
            <div className="flex items-center gap-4 pl-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#dcfce7] border border-[#bbf7d0] rounded"></span>
                Additions
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#fee2e2] border border-[#fecaca] rounded"></span>
                Deletions
              </span>
            </div>
            
            {/* Right: Output content metrics */}
            <div className="text-right pr-2">
              <span className="font-medium">Output:</span> {outputMetrics.characters.toLocaleString()} chars, {outputMetrics.words.toLocaleString()} words
            </div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <GripHorizontal className="w-6 h-6 text-theme-neutral-700" />
          </div>
        </div>
      </div>
      
      {/* Comparison Statistics */}
      <div className="mt-8 mb-4">
        <ComparisonStats 
          stats={stats} 
        />
      </div>
    </div>
  );
};

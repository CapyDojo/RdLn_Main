import React from 'react';
import { GripHorizontal } from 'lucide-react';
import { RedlineOutput } from './RedlineOutput';
import { ComparisonStats } from './ComparisonStats';
import { DiffChange, ComparisonStats as ComparisonStatsType } from '../types';
import { BaseComponentProps } from '../types/components';

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
  style,
  className
}) => {
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
        />
      </div>
      
      {/* Output Resize Handle - Positioned at bottom center of output */}
      <div className="flex justify-center">
        <div
          data-resize-handle="output-panel"
          data-testid="output-resize-handle"
          ref={outputResizeHandlers.outputResizeHandleRef}
          className="glass-panel output-resize-handle relative flex items-center w-full h-8 bg-theme-primary-200/60 hover:bg-theme-primary-300/70 cursor-row-resize transition-all duration-300 touch-none select-none backdrop-blur-md border border-theme-primary-300/30 shadow-sm hover:shadow-md px-4"
          onMouseDown={outputResizeHandlers.handleMouseDown}
          onMouseEnter={() => {
            // Apply hover effects to output panel - same as handle bar
            const outputPanels = document.querySelectorAll('[data-output-panel] .glass-panel');
            outputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              // Apply same hover state as the handle bar
              element.classList.add('hover-from-handle-primary');
              element.style.transform = 'translateY(-1px)';
              element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
            });
          }}
          onMouseLeave={() => {
            // Remove hover effects from output panel
            const outputPanels = document.querySelectorAll('[data-output-panel] .glass-panel');
            outputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              element.classList.remove('hover-from-handle-primary');
              element.style.transform = '';
            });
          }}
          title="Drag to resize output panel"
        >
          <div className="flex items-center gap-4 text-xs text-theme-primary-700">
            <span></span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#dcfce7] border border-[#bbf7d0] rounded"></span>
              Additions
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#fee2e2] border border-[#fecaca] rounded"></span>
              Deletions
            </span>
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

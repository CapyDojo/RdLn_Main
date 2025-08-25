import * as React from 'react';
import { GripHorizontal } from 'lucide-react';
import { TextInputPanel } from './TextInputPanel';
import { BaseComponentProps } from '../types/components';
import { getTextMetrics } from '../utils/textMetrics';

interface MobileInputLayoutProps extends BaseComponentProps {
  /** Original text content */
  originalText: string;
  /** Revised text content */
  revisedText: string;
  /** Whether currently processing */
  isProcessing: boolean;
  /** Panel height for fallback React state */
  panelHeight: number;
  /** Callback for original text changes */
  onOriginalTextChange: (value: string, isPasteAction?: boolean) => void;
  /** Callback for revised text changes */
  onRevisedTextChange: (value: string, isPasteAction?: boolean) => void;
  /** Panel resize handlers from hook */
  panelResizeHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    desktopInputPanelsRef: React.RefObject<HTMLDivElement>;
    mobileInputPanelsRef: React.RefObject<HTMLDivElement>;
  };
  /** Mobile resize handle ref */
  mobileResizeHandleRef: React.RefObject<HTMLDivElement>;
}

/**
 * Mobile Input Layout Component
 * 
 * Handles the stacked mobile layout with resize handle between panels.
 * Extracted from ComparisonInterface for better modularity and mobile customization.
 * 
 * Features:
 * - Stacked input panels with resize handle between them
 * - Character and word count display in resize handle
 * - Hover effects for visual feedback
 * - Integrated with useResizeHandlers hook
 */
export const MobileInputLayout: React.FC<MobileInputLayoutProps> = ({
  originalText,
  revisedText,
  isProcessing,
  panelHeight,
  onOriginalTextChange,
  onRevisedTextChange,
  panelResizeHandlers,
  mobileResizeHandleRef,
  style,
  className,
}) => {
  const originalMetrics = getTextMetrics(originalText);
  const revisedMetrics = getTextMetrics(revisedText);
  return (
    <div className={`lg:hidden ${className || ''}`} style={style}>
      <div ref={panelResizeHandlers.mobileInputPanelsRef}>
        {/* Original Panel */}
        <div data-input-panel data-panel-id="original" className="mb-0 mobile-top-panel">
          <TextInputPanel
            title="Original&nbsp;"
            value={originalText}
            onChange={onOriginalTextChange}
            placeholder="Enter text, drop files, or paste screenshots here..."
            disabled={isProcessing}
            height={panelHeight}
            iconEmoji="📄"
          />
        </div>
        
        {/* Mobile Handle - Between panels for integrated unit */}
        <div 
          className="glass-panel bg-theme-neutral-200/60 hover:bg-theme-neutral-300/70 transition-all duration-300 backdrop-blur-md border-l border-r border-theme-neutral-300/30 shadow-sm hover:shadow-md px-3 min-h-12"
          data-resize-handle="input-panels"
          ref={mobileResizeHandleRef}
          onMouseDown={panelResizeHandlers.handleMouseDown}
          onMouseEnter={() => {
            // Apply hover effects to input panels - same as handle bar
            const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel');
            inputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              // Apply same hover state as the handle bar
              element.classList.add('hover-from-handle');
              element.style.transform = 'translateY(-1px)';
              element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
            });
          }}
          onMouseLeave={() => {
            // Remove hover effects from input panels
            const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel');
            inputPanels.forEach(panel => {
              const element = panel as HTMLElement;
              element.classList.remove('hover-from-handle');
              element.style.transform = '';
            });
          }}
          title="Drag to resize input panels"
        >
          {/* Mobile layout: single line with left/center/right alignment */}
          <div className="flex justify-between items-center w-full text-xs text-theme-neutral-600 cursor-row-resize touch-none select-none">
            {/* Original metrics - left aligned */}
            <div className="flex flex-col justify-center">
              <span className="font-medium text-xs">⬆️ Original:</span>
              <span className="text-xs">{originalMetrics.characters.toLocaleString()} chars, {originalMetrics.words.toLocaleString()} words</span>
            </div>
            
            {/* Grip handle - center aligned */}
            <div className="flex items-center justify-center">
              <GripHorizontal className="w-6 h-6 text-theme-neutral-700" />
            </div>
            
            {/* Revised metrics - right aligned */}
            <div className="text-right flex flex-col justify-center">
              <span className="font-medium text-xs">Revised: ⬇️</span>
              <span className="text-xs">{revisedMetrics.characters.toLocaleString()} chars, {revisedMetrics.words.toLocaleString()} words</span>
            </div>
          </div>
        </div>
        
        {/* Revised Panel */}
        <div data-input-panel data-panel-id="revised" className="mt-0 mobile-bottom-panel">
          <TextInputPanel
            title="Revised&nbsp;"
            value={revisedText}
            onChange={onRevisedTextChange}
            placeholder="Enter text, drop files, or paste screenshots here..."
            disabled={isProcessing}
            height={panelHeight}
            iconEmoji="📝"
          />
        </div>
      </div>
    </div>
  );
};

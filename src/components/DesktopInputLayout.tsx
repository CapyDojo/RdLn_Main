import React from 'react';
import { GripHorizontal } from 'lucide-react';
import { TextInputPanel } from './TextInputPanel';
import { BaseComponentProps, LocalInputFileSource } from '../types/components';
import { getTextMetrics } from '../utils/textMetrics';

interface DesktopInputLayoutProps extends BaseComponentProps {
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
  /** Callback for file source changes */
  onOriginalFileSourceChange: (source: LocalInputFileSource | null) => void;
  onRevisedFileSourceChange: (source: LocalInputFileSource | null) => void;
  originalFileSource: LocalInputFileSource | null;
  revisedFileSource: LocalInputFileSource | null;
  originalDisconnectedFileSource: LocalInputFileSource | null;
  revisedDisconnectedFileSource: LocalInputFileSource | null;
  /** Panel resize handlers from hook */
  panelResizeHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    desktopInputPanelsRef: React.RefObject<HTMLDivElement>;
    mobileInputPanelsRef: React.RefObject<HTMLDivElement>;
  };
  /** Desktop resize handle ref */
  desktopResizeHandleRef: React.RefObject<HTMLDivElement>;
}

/**
 * Desktop Input Layout Component
 */
export const DesktopInputLayout: React.FC<DesktopInputLayoutProps> = ({
  originalText,
  revisedText,
  isProcessing,
  panelHeight,
  onOriginalTextChange,
  onRevisedTextChange,
  onOriginalFileSourceChange,
  onRevisedFileSourceChange,
  originalFileSource,
  revisedFileSource,
  originalDisconnectedFileSource,
  revisedDisconnectedFileSource,
  panelResizeHandlers,
  desktopResizeHandleRef,
  style,
  className
}) => {
  const originalMetrics = getTextMetrics(originalText);
  const revisedMetrics = getTextMetrics(revisedText);

  return (
    <div className={`hidden lg:block ${className || ''}`} style={style}>
      <div ref={panelResizeHandlers.desktopInputPanelsRef} className="grid grid-cols-2 gap-6">
        <div data-input-panel data-panel-id="original">
          <TextInputPanel
            title="Original&nbsp;"
            value={originalText}
            onChange={onOriginalTextChange}
            onFileSourceChange={onOriginalFileSourceChange}
            linkedFileSource={originalFileSource}
            disconnectedFileSource={originalDisconnectedFileSource}
            placeholder="Enter text, drop files, or paste screenshots here..."
            disabled={isProcessing}
            height={panelHeight}
            iconEmoji="📄"
          />
        </div>

        <div data-input-panel data-panel-id="revised">
          <TextInputPanel
            title="Revised&nbsp;"
            value={revisedText}
            onChange={onRevisedTextChange}
            onFileSourceChange={onRevisedFileSourceChange}
            linkedFileSource={revisedFileSource}
            disconnectedFileSource={revisedDisconnectedFileSource}
            placeholder="Enter text, drop files, or paste screenshots here..."
            disabled={isProcessing}
            height={panelHeight}
            iconEmoji="📝"
          />
        </div>
      </div>

      <div className="flex justify-center mb-2">
        <div className="glass-panel bg-theme-neutral-200/60 hover:bg-theme-neutral-300/70 transition-all duration-300 backdrop-blur-md border border-theme-neutral-300/30 shadow-sm hover:shadow-md px-2 py-1">
          <div className="flex items-center gap-4">
            <div className="text-xs text-theme-neutral-600 whitespace-nowrap">
              <span className="font-medium">  Original:</span> {originalMetrics.characters.toLocaleString()} chars, {originalMetrics.words.toLocaleString()} words
            </div>

            <div
              data-resize-handle="input-panels"
              ref={desktopResizeHandleRef}
              className="flex items-center justify-center w-12 h-7 cursor-row-resize touch-none select-none"
              onMouseDown={panelResizeHandlers.handleMouseDown}
              onMouseEnter={() => {
                const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel');
                inputPanels.forEach(panel => {
                  const element = panel as HTMLElement;
                  element.classList.add('hover-from-handle');
                  element.style.transform = 'translateY(-1px)';
                  element.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
                });
              }}
              onMouseLeave={() => {
                const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel');
                inputPanels.forEach(panel => {
                  const element = panel as HTMLElement;
                  element.classList.remove('hover-from-handle');
                  element.style.transform = '';
                });
              }}
              title="Drag to resize input panels"
            >
              <GripHorizontal className="w-6 h-6 text-theme-neutral-700" />
            </div>

            <div className="text-xs text-theme-neutral-600 whitespace-nowrap">
              <span className="font-medium">Revised:</span> {revisedMetrics.characters.toLocaleString()} chars, {revisedMetrics.words.toLocaleString()} words
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

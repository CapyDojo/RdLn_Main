import * as React from 'react';
import { GripHorizontal } from 'lucide-react';
import { TextInputPanel } from './TextInputPanel';
import { BaseComponentProps, LocalInputFileSource } from '../types/components';
import { getTextMetrics } from '../utils/textMetrics';

interface MobileInputLayoutProps extends BaseComponentProps {
  originalText: string;
  revisedText: string;
  isProcessing: boolean;
  panelHeight: number;
  onOriginalTextChange: (value: string, isPasteAction?: boolean) => void;
  onRevisedTextChange: (value: string, isPasteAction?: boolean) => void;
  onOriginalFileSourceChange: (source: LocalInputFileSource | null) => void;
  onRevisedFileSourceChange: (source: LocalInputFileSource | null) => void;
  originalFileSource: LocalInputFileSource | null;
  revisedFileSource: LocalInputFileSource | null;
  originalDisconnectedFileSource: LocalInputFileSource | null;
  revisedDisconnectedFileSource: LocalInputFileSource | null;
  panelResizeHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    desktopInputPanelsRef: React.RefObject<HTMLDivElement>;
    mobileInputPanelsRef: React.RefObject<HTMLDivElement>;
  };
  mobileResizeHandleRef: React.RefObject<HTMLDivElement>;
}

export const MobileInputLayout: React.FC<MobileInputLayoutProps> = ({
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
  mobileResizeHandleRef,
  style,
  className,
}) => {
  const originalMetrics = getTextMetrics(originalText);
  const revisedMetrics = getTextMetrics(revisedText);

  return (
    <div className={`lg:hidden ${className || ''}`} style={style}>
      <div ref={panelResizeHandlers.mobileInputPanelsRef}>
        <div data-input-panel data-panel-id="original" className="mb-0 mobile-top-panel">
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

        <div
          className="glass-panel bg-theme-neutral-200/60 hover:bg-theme-neutral-300/70 transition-all duration-300 backdrop-blur-md border-l border-r border-theme-neutral-300/30 shadow-sm hover:shadow-md px-3 min-h-12"
          data-resize-handle="input-panels"
          ref={mobileResizeHandleRef}
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
          <div className="flex justify-between items-center w-full text-xs text-theme-neutral-600 cursor-row-resize touch-none select-none">
            <div className="flex flex-col justify-center">
              <span className="font-medium text-xs">⬆️ Original:</span>
              <span className="text-xs">{originalMetrics.characters.toLocaleString()} chars, {originalMetrics.words.toLocaleString()} words</span>
            </div>

            <div className="flex items-center justify-center">
              <GripHorizontal className="w-6 h-6 text-theme-neutral-700" />
            </div>

            <div className="text-right flex flex-col justify-center">
              <span className="font-medium text-xs">Revised: ⬇️</span>
              <span className="text-xs">{revisedMetrics.characters.toLocaleString()} chars, {revisedMetrics.words.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        <div data-input-panel data-panel-id="revised" className="mt-0 mobile-bottom-panel">
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
    </div>
  );
};

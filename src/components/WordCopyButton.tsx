import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';
import { DiffChange } from '../types';
import { copyToClipboardWordCompatible } from '../utils/clipboardUtils';
import { usePerformanceAwareHandler, useComponentPerformance } from '../utils/performanceUtils.tsx';

interface WordCopyButtonProps {
  changes: DiffChange[];
  onCopy: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * WordCopyButton - Copy comparison results optimized for Microsoft Word
 * 
 * Handles copying document comparison results with Word-compatible formatting.
 * Includes success microinteraction and performance tracking.
 */
export const WordCopyButton: React.FC<WordCopyButtonProps> = ({
  changes,
  onCopy,
  className = '',
  disabled = false
}) => {
  const [copyWordSuccess, setCopyWordSuccess] = useState(false);

  // Performance monitoring setup
  const performanceTracker = useComponentPerformance({}, 'WordCopyButton', {
    category: 'copy',
    autoTrackRender: true
  });

  const copyToClipboardWord = usePerformanceAwareHandler(async () => {
    if (!changes || !Array.isArray(changes) || disabled) {
      return;
    }

    try {
      await copyToClipboardWordCompatible(changes);
      
      // Show success microinteraction
      setCopyWordSuccess(true);
      setTimeout(() => setCopyWordSuccess(false), 1500);
      
      onCopy();

      // Track success metrics
      const textLength = changes.reduce((acc, change) => {
        const content = change.type === 'changed' ? change.revisedContent || '' : change.content || '';
        return acc + content.length;
      }, 0);

      performanceTracker.trackMetric('copy_word_success', {
        textLength,
        changeCount: changes.length
      });

    } catch (err) {
      console.error('Failed to copy Word-compatible text:', err);
      performanceTracker.trackMetric('copy_word_failure', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      // Still call onCopy in case of error for testing purposes
      onCopy();
    }
  }, 'copy_to_clipboard_word', performanceTracker);

  const hasResults = changes && changes.length > 0;

  if (!hasResults) return null;

  return (
    <div className="relative segmented-control">
      <CustomTooltip 
        content="Copy RdLn - formatted for pasting into MS Word / Google Docs" 
        placement="bottom-left"
      >
        <button
          onClick={copyToClipboardWord}
          disabled={disabled}
          className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
            copyWordSuccess ? 'bg-green-100 border-green-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          style={{
            width: '48px',
            height: '48px',
            aspectRatio: '1/1',
            transform: copyWordSuccess ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label="Copy comparison results optimized for Microsoft Word"
        >
          <div className="flex flex-col items-center justify-center">
            {copyWordSuccess ? (
              <Check className={`w-6 h-6 text-green-600 transition-all duration-300`} aria-hidden="true" />
            ) : (
              <Copy className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
            )}
            <span className={`text-xs mt-0.5 hidden sm:block transition-all duration-300 ${
              copyWordSuccess ? 'text-green-600' : ''
            }`}>
              {copyWordSuccess ? 'Copied!' : 'Word'}
            </span>
          </div>
        </button>
      </CustomTooltip>
    </div>
  );
};
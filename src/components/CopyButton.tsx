import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';
import { DiffChange } from '../types';
import { copyToClipboardMultiFormat, isMultiFormatClipboardSupported } from '../utils/clipboardUtils';
import { usePerformanceAwareHandler, useComponentPerformance } from '../utils/performanceUtils.tsx';

interface CopyButtonProps {
  changes: DiffChange[];
  onCopy: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * CopyButton - Copy comparison results to clipboard
 * 
 * Handles copying document comparison results with HTML formatting support.
 * Includes success microinteraction and performance tracking.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  changes,
  onCopy,
  className = '',
  disabled = false
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  // Performance monitoring setup
  const performanceTracker = useComponentPerformance({}, 'CopyButton', {
    category: 'copy',
    autoTrackRender: true
  });

  const copyToClipboard = usePerformanceAwareHandler(async () => {
    if (!changes || !Array.isArray(changes) || disabled) {
      return;
    }

    try {
      await copyToClipboardMultiFormat(changes);
      
      // Show success microinteraction
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
      
      onCopy();

      // Track success metrics
      const textLength = changes.reduce((acc, change) => {
        const content = change.type === 'changed' ? change.revisedContent || '' : change.content || '';
        return acc + content.length;
      }, 0);

      performanceTracker.trackMetric('copy_success', {
        textLength,
        multiFormat: isMultiFormatClipboardSupported(),
        changeCount: changes.length
      });

    } catch (err) {
      console.error('Failed to copy text:', err);
      performanceTracker.trackMetric('copy_failure', {
        error: err instanceof Error ? err.message : 'Unknown error',
        multiFormat: isMultiFormatClipboardSupported()
      });
      // Still call onCopy in case of error for testing purposes
      onCopy();
    }
  }, 'copy_to_clipboard', performanceTracker);

  const hasResults = changes && changes.length > 0;

  if (!hasResults) return null;

  return (
    <div className="relative segmented-control">
      <CustomTooltip
        content={isMultiFormatClipboardSupported()
          ? "Copy RdLn - formatted for pasting into Emails"
          : "Copy RdLn as plain text"
        }
        placement="bottom-left"
      >
        <button
          onClick={copyToClipboard}
          disabled={disabled}
          className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
            copySuccess ? 'bg-green-100 border-green-300' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
          style={{
            width: '48px',
            height: '48px',
            aspectRatio: '1/1',
            transform: copySuccess ? 'scale(1.05)' : 'scale(1)',
          }}
          aria-label={isMultiFormatClipboardSupported()
            ? "Copy comparison results with HTML formatting"
            : "Copy comparison results as plain text"
          }
        >
          <div className="flex flex-col items-center justify-center">
            {copySuccess ? (
              <Check className={`w-6 h-6 text-green-600 transition-all duration-300`} aria-hidden="true" />
            ) : (
              <Copy className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
            )}
            <span className={`text-xs mt-0.5 hidden sm:block transition-all duration-300 ${
              copySuccess ? 'text-green-600' : ''
            }`}>
              {copySuccess ? 'Copied!' : 'Copy'}
            </span>
          </div>
        </button>
      </CustomTooltip>
    </div>
  );
};
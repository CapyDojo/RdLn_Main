import React from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { DiffChange } from '../types';
import { BaseComponentProps } from '../types/components';
import { UI_CONFIG, FEATURE_FLAGS, DEV_CONFIG } from '../config/appConfig';
import { useComponentPerformance, usePerformanceAwareHandler } from '../utils/performanceUtils.tsx';
import { useExperimentalFeatures } from '../contexts/ExperimentalLayoutContext';
import { ResultsOverlayTrigger } from './experimental/ResultsOverlayTrigger';
import { FullScreenButton } from './FullScreenButton';
import { CustomTooltip } from './CustomTooltip';
import { useFontSize } from '../contexts/FontSizeContext';
import { copyToClipboardMultiFormat, isMultiFormatClipboardSupported, copyToClipboardWordCompatible } from '../utils/clipboardUtils';
import { FontSizeSelector } from './FontSizeSelector';
import { exportHtmlDiffToDocx } from '../lib/docxExport';

interface RedlineOutputProps extends BaseComponentProps {
  changes: DiffChange[];
  onCopy: () => void;
  height?: number;
  isProcessing?: boolean;
  processingStatus?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onShowOverlay?: () => void;
  isInOverlayMode?: boolean;
  hideHeader?: boolean;
  backgroundMode?: 'theme' | 'glassmorphism';
  onBackgroundModeChange?: (mode: 'theme' | 'glassmorphism') => void;
  onToggleFullScreen?: () => void;
  isFullScreen?: boolean;
  // Optional metadata to improve export filenames
  documentTitle?: string;
  originalTitle?: string;
  revisedTitle?: string;
  originalText?: string;
  revisedText?: string;
}

// SSMR: Use centralized configuration for consistent chunk rendering
const { CHUNK_SIZE, ESTIMATED_CHUNK_HEIGHT, INTERSECTION_MARGIN } = UI_CONFIG.RENDERING;

// Boundary fragments are now handled directly in the Myers algorithm implementation
const RedlineOutputBase: React.FC<RedlineOutputProps> = ({
  changes,
  onCopy,
  height = 500,
  isProcessing = false,
  processingStatus = 'Processing...',
  scrollRef,
  onShowOverlay,
  isInOverlayMode = false,
  hideHeader = false,
  backgroundMode: externalBackgroundMode,
  onBackgroundModeChange,
  onToggleFullScreen,
  isFullScreen = false,
  style,
  className,
  ...props
}) => {
  // Performance monitoring setup
  const performanceTracker = useComponentPerformance(props, 'RedlineOutput', {
    category: 'output',
    autoTrackRender: true
  });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Get experimental features for overlay trigger
  const { features } = useExperimentalFeatures();

  // Background mode state (only used in overlay mode) - sync with external state
  const [backgroundMode, setBackgroundMode] = React.useState<'theme' | 'glassmorphism'>(
    externalBackgroundMode || 'theme'
  );

  // Sync local state with external prop when it changes
  React.useEffect(() => {
    if (externalBackgroundMode && externalBackgroundMode !== backgroundMode) {
      setBackgroundMode(externalBackgroundMode);
    }
  }, [externalBackgroundMode, backgroundMode]);

  
  // Copy success state for microinteraction
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [copyWordSuccess, setCopyWordSuccess] = React.useState(false);

  // DOCX export state
  const [exportingDocx, setExportingDocx] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);

  // Font size context
  const { fontSize } = useFontSize();

  // Always render changes directly in clean mode
  const filteredChanges = changes;

  // --- Smart DOCX filename helpers ---
  const sanitizeFilename = (name: string) =>
    name
      .replace(/[<>:"/\\|?*]+/g, ' ') // illegal filename chars
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim()
      .slice(0, 120); // keep it reasonable

  const firstLineFrom = (text?: string): string | undefined => {
    if (!text) return undefined;
    // remove basic HTML tags if any and split into lines
    const plain = text.replace(/<[^>]+>/g, ' ').replace(/\r\n/g, '\n');
    const firstNonEmpty = plain
      .split('\n')
      .map(s => s.trim())
      .find(s => s.length > 0);
    return firstNonEmpty;
  };

  const timestamp = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}${mm}${dd}_${hh}${mi}`;
  };

  const suggestDocxName = () => {
    // Prefer explicit document title
    const docTitle = props.documentTitle && sanitizeFilename(props.documentTitle);
    // Titles from props if provided
    const origTitle = props.originalTitle || firstLineFrom(props.originalText);
    const revTitle = props.revisedTitle || firstLineFrom(props.revisedText);

    const ts = timestamp();

    if (docTitle && docTitle.length > 0) {
      return `${docTitle} - RdLn - ${ts}.docx`;
    }

    if (origTitle && revTitle) {
      const a = sanitizeFilename(origTitle);
      const b = sanitizeFilename(revTitle);
      if (a && b) return `${a} → ${b} - RdLn - ${ts}.docx`;
    }

    if (origTitle) {
      const a = sanitizeFilename(origTitle);
      if (a) return `${a} - RdLn - ${ts}.docx`;
    }

    if (revTitle) {
      const b = sanitizeFilename(revTitle);
      if (b) return `${b} - RdLn - ${ts}.docx`;
    }

    return `RdLn_${ts}.docx`;
  };


  // Handle background mode toggle
  const handleBackgroundToggle = () => {
    const newMode = backgroundMode === 'theme' ? 'glassmorphism' : 'theme';
    setBackgroundMode(newMode);
    if (onBackgroundModeChange) {
      onBackgroundModeChange(newMode);
    }
  };

  // Memoize the generated chunks and their HTML strings with performance tracking
  const chunks = React.useMemo(() => {
    const startTime = performance.now();

    // Handle undefined or null changes
    if (!filteredChanges || !Array.isArray(filteredChanges)) {
      return [];
    }

    // Track input metrics
    performanceTracker.trackMetric('changes_count', filteredChanges.length);

    // Boundary fragments are handled in the Myers algorithm implementation

    // Check if chunked rendering is enabled
    if (!FEATURE_FLAGS.ENABLE_CHUNKED_RENDERING) {
      if (DEV_CONFIG.DEBUGGING.SEMANTIC_CHUNKING_DEBUG) {
        performanceTracker.trackMetric('rendering_without_chunking', { count: filteredChanges.length });
      }
      // Return single chunk with all changes
      const result = [{
        id: 'single-chunk',
        changes: filteredChanges,
        html: generateHTMLString(filteredChanges),
      }];

      const renderingTime = performance.now() - startTime;
      performanceTracker.trackMetric('rendering_performance', {
        duration: renderingTime,
        chunkCount: 1,
        totalChanges: filteredChanges.length
      });

      return result;
    }

    if (DEV_CONFIG.DEBUGGING.SEMANTIC_CHUNKING_DEBUG) {
      performanceTracker.trackMetric('memoizing_changes', { count: filteredChanges.length, chunkSize: CHUNK_SIZE });
    }
    const chunkedChanges = [];
    let i = 0;
    while (i < filteredChanges.length) {
      const chunkEnd = FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
        ? findSemanticChunkBoundary(filteredChanges, i, CHUNK_SIZE)
        : Math.min(i + CHUNK_SIZE, filteredChanges.length);

      chunkedChanges.push(filteredChanges.slice(i, chunkEnd));
      i = chunkEnd;
    }

    const result = chunkedChanges.map((chunk, index) => ({
      id: `chunk-${index}`,
      changes: chunk,
      html: FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
        ? generateSemanticHTMLString(chunk)
        : generateHTMLString(chunk),
    }));

    // Track chunking performance
    const chunkingTime = performance.now() - startTime;
    performanceTracker.trackMetric('chunking_performance', {
      duration: chunkingTime,
      chunkCount: result.length,
      avgChunkSize: filteredChanges.length / result.length
    });

    return result;
  }, [filteredChanges, performanceTracker]);

  const copyToClipboard = usePerformanceAwareHandler(async () => {
    if (!filteredChanges || !Array.isArray(filteredChanges)) {
      return;
    }

    try {
      await copyToClipboardMultiFormat(filteredChanges);
      
      // Show success microinteraction
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
      
      onCopy();

      // Track success metrics
      const textLength = filteredChanges.reduce((acc, change) => {
        const content = change.type === 'changed' ? change.revisedContent || '' : change.content || '';
        return acc + content.length;
      }, 0);

      performanceTracker.trackMetric('copy_success', {
        textLength,
        multiFormat: isMultiFormatClipboardSupported(),
        changeCount: filteredChanges.length
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

  const copyToClipboardWord = usePerformanceAwareHandler(async () => {
    if (!filteredChanges || !Array.isArray(filteredChanges)) {
      return;
    }

    try {
      await copyToClipboardWordCompatible(filteredChanges);
      
      // Show success microinteraction
      setCopyWordSuccess(true);
      setTimeout(() => setCopyWordSuccess(false), 1500);
      
      onCopy();

      // Track success metrics
      const textLength = filteredChanges.reduce((acc, change) => {
        const content = change.type === 'changed' ? change.revisedContent || '' : change.content || '';
        return acc + content.length;
      }, 0);

      performanceTracker.trackMetric('copy_word_success', {
        textLength,
        changeCount: filteredChanges.length
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

  const exportDocx = usePerformanceAwareHandler(async () => {
    if (!filteredChanges || !Array.isArray(filteredChanges) || filteredChanges.length === 0) return;
    try {
      setExportingDocx(true);
      // Combine chunk HTML into a single container div to match our exporter expectations
      const combinedHtml = `\n<div style="font-family: serif;  white-space: pre-wrap;">${
        (chunks || []).map(c => c.html).join('')
      }</div>`;
      const bytes = await exportHtmlDiffToDocx(combinedHtml, { author: 'RdLn' });

      const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const blob = new Blob([bytes], { type: mime });
      const filename = suggestDocxName();

      // Quick validity check: DOCX (ZIP) should start with 'PK' (0x50, 0x4B)
      if (!(bytes && bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4B)) {
        console.error('Generated file is not a ZIP (PK) header. Size:', bytes?.byteLength);
      }

      // Prefer browser download UI (anchor + download) for consistent user feedback.
      // Keep native File System Access picker available behind a flag if needed later.
      const w = window as any;
      const useNativePicker = FEATURE_FLAGS.ENABLE_NATIVE_SAVE_PICKER;

      if (useNativePicker && w && typeof w.showSaveFilePicker === 'function') {
        try {
          const handle = await w.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Word Document (.docx)',
              accept: { [mime]: ['.docx'] },
            }],
          });
          const stream = await handle.createWritable();
          await stream.write(blob);
          await stream.close();
        } catch (pickerErr: any) {
          // If user cancels (AbortError), do nothing.
          const name = pickerErr?.name || pickerErr?.constructor?.name;
          if (name === 'AbortError') {
            return; // user cancelled save dialog
          }
          // For other failures, fall back to anchor method
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.setAttribute('href', url);
          a.setAttribute('download', filename);
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 1000);
        }
      } else {
        // Blob URL + download attribute triggers browser's download UI
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 1000);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 1500);
      performanceTracker.trackMetric('docx_export_success', { bytes: bytes.byteLength });
    } catch (err) {
      console.error('DOCX export failed:', err);
      performanceTracker.trackMetric('docx_export_failure', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setExportingDocx(false);
    }
  }, 'export_docx', performanceTracker);

  return (
    <div
      className={`glass-panel glass-content-panel overflow-hidden shadow-lg transition-all duration-300 ${className || ''}`}
      style={style}
      {...props}
    >
      {/* Conditionally render header - hidden in overlay mode */}
      {!hideHeader && (
        <div className={`glass-panel-header-footer px-4 py-3 flex items-center relative ${isInOverlayMode ? 'justify-between' : 'justify-between'}`}>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-theme-neutral-300 to-transparent"></div>
          
          {/* Left side content */}
          <div className="flex items-center gap-2">
            {!isInOverlayMode ? (
              <>
                <span className="text-5xl" role="img" aria-label="Output panel">🎯</span>
                <h3 className="text-3xl font-semibold text-theme-primary-900">Compared RdLn</h3>
              </>
            ) : (
              <FontSizeSelector />
            )}
          </div>

          {/* Center content - Glass/Flat toggle in overlay mode */}
          {isInOverlayMode && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="relative segmented-control background-mode-toggle">
                <button
                  onClick={() => {
                    setBackgroundMode('theme');
                    if (onBackgroundModeChange) onBackgroundModeChange('theme');
                  }}
                  className={`segment ${backgroundMode === 'theme' ? 'active' : ''}`}
                >
                  Flat
                </button>
                <button
                  onClick={() => {
                    setBackgroundMode('glassmorphism');
                    if (onBackgroundModeChange) onBackgroundModeChange('glassmorphism');
                  }}
                  className={`segment ${backgroundMode === 'glassmorphism' ? 'active' : ''}`}
                >
                  Glass
                </button>
                <div className={`sliding-indicator ${backgroundMode === 'theme' ? 'to-left' : 'to-right'}`}></div>
              </div>
            </div>
          )}

          {/* Right side content */}
          <div className="flex items-center gap-2">

            {/* Results Overlay Trigger - only in normal mode */}
            {!isInOverlayMode && (
              <ResultsOverlayTrigger
                isVisible={features.resultsOverlay}
                hasResults={filteredChanges && filteredChanges.length > 0}
                onClick={onShowOverlay || (() => console.log('🎯 Results Overlay: Manual trigger (no handler)'))}
                isInOverlayMode={isInOverlayMode}
              />
            )}

            {/* Copy Button */}
            <div className="relative segmented-control">
              <CustomTooltip
                content={isMultiFormatClipboardSupported()
                  ? "Copy RdLn - optimized for Emails"
                  : "Copy RdLn as plain text"
                }
                placement="left"
              >
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
                    copySuccess ? 'bg-green-100 border-green-300' : ''
                  }`}
                style={{
                  width: '48px',
                  height: '48px',
                  aspectRatio: '1/1',
                  transform: copySuccess ? 'scale(1.05)' : 'scale(1)',
                }}
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

            {/* Copy for Word Button - Feature Flagged */}
            {FEATURE_FLAGS.ENABLE_WORD_OPTIMIZED_COPY && (
              <div className="relative segmented-control">
                <CustomTooltip content="Copy RdLn - optimized for MS Word / Google Docs" placement="left">
                  <button
                    onClick={copyToClipboardWord}
                    className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
                      copyWordSuccess ? 'bg-green-100 border-green-300' : ''
                    }`}
                    style={{
                      width: '48px',
                      height: '48px',
                      aspectRatio: '1/1',
                      transform: copyWordSuccess ? 'scale(1.05)' : 'scale(1)',
                    }}
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
            )}

            {/* Download DOCX Button */}
            <div className="relative segmented-control">
              <CustomTooltip content="Export RdLn as native Word .DOCX with Track Changes" placement="left">
                <button
                  onClick={exportDocx}
                  disabled={exportingDocx || !filteredChanges || filteredChanges.length === 0}
                  className={`flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment ${
                    exportSuccess ? 'bg-green-100 border-green-300' : ''
                  } ${exportingDocx ? 'opacity-70 cursor-not-allowed' : ''}`}
                  style={{
                    width: '48px',
                    height: '48px',
                    aspectRatio: '1/1',
                    transform: exportSuccess ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <div className="flex flex-col items-center justify-center">
                    {exportSuccess ? (
                      <Check className={`w-6 h-6 text-green-600 transition-all duration-300`} aria-hidden="true" />
                    ) : (
                      <Download className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
                    )}
                    <span className={`text-xs mt-0.5 hidden sm:block transition-all duration-300 ${
                      exportSuccess ? 'text-green-600' : ''
                    }`}>
                      {exportSuccess ? 'Saved!' : 'DOCX'}
                    </span>
                  </div>
                </button>
              </CustomTooltip>
            </div>

            {/* Full Screen Button */}
            <div className="relative segmented-control">
              <FullScreenButton
                isFullScreen={isFullScreen}
                onToggle={onToggleFullScreen || (() => {})}
                hasResults={filteredChanges && filteredChanges.length > 0}
              />
            </div>
          </div>
        </div>
      )}
      <div
        ref={(el) => {
          if (scrollContainerRef.current !== el) {
            (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
          if (scrollRef && el && scrollRef.current !== el) {
            (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }
        }}
        className="glass-panel-inner-content overflow-y-auto"
        style={{
          height: `${height - (hideHeader ? 0 : 120)}px`,
          minHeight: '200px',
        }}
      >
        <div className="glass-input-field user-text-area font-serif text-theme-neutral-800 whitespace-pre-wrap libertinus-math-output libertinus-math-text py-6 px-8" data-user-font-size={fontSize} style={{ lineHeight: '2' }}>
          {isProcessing ? (
            <div className="mt-4 p-3 bg-theme-primary-50 border border-theme-primary-200 rounded-lg">
              <div className="flex items-center gap-2 text-theme-primary-700">
                <div className="w-4 h-4 border-2 border-theme-primary-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">{processingStatus}</span>
              </div>
            </div>
          ) : (
            chunks.map(chunk => (
              <Chunk
                key={chunk.id}
                html={chunk.html}
                estimatedHeight={ESTIMATED_CHUNK_HEIGHT}
                root={scrollContainerRef.current}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component for a single chunk
const Chunk: React.FC<{ html: string, estimatedHeight: number, root: Element | null }> = ({ html, estimatedHeight, root }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const placeholderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Check if we're in a test environment or if IntersectionObserver is not available
    if (typeof IntersectionObserver === 'undefined' ||
      typeof process !== 'undefined' && process.env.NODE_ENV === 'test' ||
      typeof window !== 'undefined' && window.location.href.includes('vitest')) {
      // In test environments or unsupported browsers, make chunks visible immediately
      setIsVisible(true);
      return;
    }

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { root, rootMargin: INTERSECTION_MARGIN } // Preload chunks before they become visible
      );

      if (placeholderRef.current && observer.observe) {
        observer.observe(placeholderRef.current);
      } else {
        // Fallback if observe method is not available
        setIsVisible(true);
      }

      return () => {
        if (observer.disconnect) {
          observer.disconnect();
        }
      };
    } catch (error) {
      // Fallback if IntersectionObserver fails
      setIsVisible(true);
    }
  }, [root]);

  if (isVisible) {
    return (
      <div
        ref={placeholderRef}
        className="chunk-container"
        style={{ lineHeight: '2' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      ref={placeholderRef}
      style={{ height: `${estimatedHeight}px` }}
      className="chunk-container"
    />
  );
};

// Helper function to generate static HTML from changes in clean mode
const generateHTMLString = (changes: DiffChange[]) => {
  let html = '';
  changes.forEach(change => {
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

    switch (change.type) {
      case 'added':
        html += `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(change.content || '')}</span>`;
        break;
      case 'removed':
        html += `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(change.content || '')}</span>`;
        break;
      case 'changed':
        // Special case: if both original and revised are pure whitespace, render cleanly
        const originalContent = change.originalContent || '';
        const revisedContent = change.revisedContent || '';
        const isPureWhitespaceSubstitution = /^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent);
        
        if (isPureWhitespaceSubstitution) {
          // Clean mode: render whitespace substitutions without highlighting
          html += `<span>${escape(revisedContent)}</span>`;
        } else {
          // For regular substitutions: show full highlighting
          html += `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(originalContent)}</span><span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(revisedContent)}</span>`;
        }
        break;
      default:
        html += `<span>${escape(change.content || '')}</span>`;
        break;
    }
  });
  return html;
};

// Semantic boundary detection functions
const isSemanticBoundary = (change: DiffChange) => {
  const content = change.content || '';
  return content.includes(' ') || content.includes('\n') || content.includes('.') || content.includes(',');
};

const findSemanticChunkBoundary = (changes: DiffChange[], startIndex: number, targetSize: number) => {
  if (!UI_CONFIG.RENDERING.SEMANTIC_CHUNKING.ENABLED) {
    return Math.min(startIndex + targetSize, changes.length);
  }

  let currentSize = 0;
  let lastGoodBoundary = startIndex;

  for (let i = startIndex; i < changes.length && currentSize < targetSize * 1.2; i++) {
    currentSize++;

    // Look for natural boundaries
    if (isSemanticBoundary(changes[i])) {
      lastGoodBoundary = i + 1;
    }

    if (currentSize >= targetSize && lastGoodBoundary > startIndex) {
      return lastGoodBoundary;
    }
  }

  return Math.min(startIndex + targetSize, changes.length);
};


// Helper functions for semantic grouping
const collectConsecutiveChanges = (changes: DiffChange[], startIndex: number, type: string) => {
  const group = [];
  let i = startIndex;
  const maxGroup = UI_CONFIG.RENDERING.SEMANTIC_CHUNKING.MAX_CONSECUTIVE_SAME_TYPE;

  while (i < changes.length && changes[i].type === type && group.length < maxGroup) {
    group.push(changes[i]);
    i++;
  }

  return group;
};

const renderChangeGroup = (group: DiffChange[], type: string) => {
  const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

  if (type === 'changed') {
    // For changed type, combine all original content and all revised content
    const combinedOriginal = group.map(change => change.originalContent || '').join('');
    const combinedRevised = group.map(change => change.revisedContent || '').join('');

    return `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(combinedOriginal)}</span>` +
      `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(combinedRevised)}</span>`;
  } else {
    // For added/removed, combine content
    const combinedContent = group.map(change => change.content || '').join('');
    const styleAttr = type === 'added'
      ? 'background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; '
      : 'background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ';

    return `<span style="${styleAttr}">${escape(combinedContent)}</span>`;
  }
};

const renderSingleChange = (change: DiffChange) => {
  // Use existing logic for single changes
  const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

  switch (change.type) {
    case 'added':
      return `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(change.content || '')}</span>`;
    case 'removed':
      return `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(change.content || '')}</span>`;
    case 'changed':
      // Apply clean whitespace logic consistently across both rendering paths
      const originalContent = change.originalContent || '';
      const revisedContent = change.revisedContent || '';
      const isPureWhitespaceSubstitution = /^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent);
      
      if (isPureWhitespaceSubstitution) {
        // Clean mode: render whitespace substitutions without highlighting
        return `<span>${escape(revisedContent)}</span>`;
      } else {
        // For regular substitutions: show full highlighting
        return `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(originalContent)}</span>` +
          `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escape(revisedContent)}</span>`;
      }
    default:
      return `<span>${escape(change.content || '')}</span>`;
  }
};

// Semantic-aware HTML generation function
const generateSemanticHTMLString = (changes: DiffChange[]) => {
  // Check feature flag once at the beginning
  if (!FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING) {
    return generateHTMLString(changes); // Fallback to original
  }

  if (DEV_CONFIG.DEBUGGING.SEMANTIC_CHUNKING_DEBUG) {
    console.log('🔧 Semantic chunking processing', changes.length, 'changes');
  }

  let html = '';
  let i = 0;
  let groupsCreated = 0;

  while (i < changes.length) {
    const current = changes[i];

    // Group consecutive changes of same type (including 'changed')
    if (current.type === 'added' || current.type === 'removed' || current.type === 'changed') {
      const group = collectConsecutiveChanges(changes, i, current.type);

      if (DEV_CONFIG.DEBUGGING.SEMANTIC_CHUNKING_DEBUG) {
        console.log(`🔧 Found group of ${group.length} ${current.type} changes`);
      }

      if (group.length > 1) {
        html += renderChangeGroup(group, current.type);
        groupsCreated++;
      } else {
        html += renderSingleChange(current);
      }
      i += group.length;
    } else {
      html += renderSingleChange(current);
      i++;
    }
  }

  if (DEV_CONFIG.DEBUGGING.SEMANTIC_CHUNKING_DEBUG) {
    console.log('🔧 Semantic chunking results:', {
      originalLength: changes.length,
      groupsCreated,
      enabled: FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
    });
  }

  return html;
};

// Main component export
export const RedlineOutput = React.memo(RedlineOutputBase);


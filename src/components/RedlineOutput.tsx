import React from 'react';
import { Filter } from 'lucide-react';
import { DiffChange } from '../types';
import { BaseComponentProps } from '../types/components';
import { UI_CONFIG, FEATURE_FLAGS, DEV_CONFIG } from '../config/appConfig';
import { useComponentPerformance } from '../utils/performanceUtils.tsx';
import { useExperimentalFeatures } from '../contexts/ExperimentalLayoutContext';
import { ResultsOverlayTrigger } from './experimental/ResultsOverlayTrigger';
import { FullScreenButton } from './FullScreenButton';
import { CopyButton } from './CopyButton';
import { WordCopyButton } from './WordCopyButton';
import { DocxExportButton } from './DocxExportButton';
import { useFontSize } from '../contexts/FontSizeContext';
import { FontSizeSelector } from './FontSizeSelector';
import { CustomTooltip } from './CustomTooltip';
import '../styles/whitespace-toggle.css';

// Type definition for chunk objects - now lightweight without pre-generated HTML
interface ChunkData {
  id: string;
  changes: DiffChange[];
}

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
  // Optional callback for auto-height adjustment
  onHeightChangeRequest?: (height: number) => void;
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
  onHeightChangeRequest,
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



  // Font size context
  const { fontSize } = useFontSize();

  // Whitespace cleanup toggle state - CSS-based approach
  const [cleanWhitespace, setCleanWhitespace] = React.useState(true);

  // CSS-based toggle handler - no DOM manipulation, just class toggling
  const handleWhitespaceToggle = React.useCallback(() => {
    setCleanWhitespace(prev => !prev);
  }, []);

  // Always render changes directly in clean mode
  const filteredChanges = changes;

  // Auto-expand height to fit content when new comparison results are loaded
  React.useEffect(() => {
    // Only auto-expand if we have content and a callback
    if (!onHeightChangeRequest || !filteredChanges || filteredChanges.length === 0 || isProcessing) {
      return;
    }

    // Use requestAnimationFrame to ensure content is fully rendered
    const measureHeight = () => {
      requestAnimationFrame(() => {
        const contentContainer = scrollContainerRef.current;
        if (!contentContainer) return;

        // Get the actual content height (scrollHeight includes all content)
        const contentHeight = contentContainer.scrollHeight;
        
        // Add header height to get total panel height
        const headerHeight = hideHeader ? 0 : UI_CONFIG.PANEL_HEIGHTS.HEADER_FOOTER_HEIGHT;
        const totalHeight = contentHeight + headerHeight;
        
        // Respect max height limit
        const maxHeight = UI_CONFIG.PANEL_HEIGHTS.MAX_OUTPUT_HEIGHT;
        const requestedHeight = Math.min(totalHeight, maxHeight);
        
        // Only request height change if it's significantly different from current
        const currentHeight = height;
        const heightDifference = Math.abs(requestedHeight - currentHeight);
        
        // Request height change if difference is more than 50px (avoid tiny adjustments)
        if (heightDifference > 50) {
          onHeightChangeRequest(requestedHeight);
        }
      });
    };

    // Delay measurement slightly to ensure chunks are rendered
    const timeoutId = setTimeout(measureHeight, 100);
    
    return () => clearTimeout(timeoutId);
  }, [filteredChanges, onHeightChangeRequest, isProcessing, hideHeader, height]);



  // Memoize the generated chunks and their HTML strings with performance tracking
  const chunks = React.useMemo((): ChunkData[] => {
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
      // Return single chunk with all changes - no pre-generated HTML
      const result = [{
        id: 'single-chunk',
        changes: filteredChanges,
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



  return (
    <div
      className={`glass-panel glass-content-panel overflow-hidden shadow-lg transition-all duration-300 w-full max-w-6xl mx-auto ${className || ''}`}
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
                <span className="text-3.5xl" role="img" aria-label="Output panel">✅</span>
                <h3 className="text-2.5xl font-semibold text-theme-primary-900">Compared RdLn</h3>
                
                {/* Whitespace cleanup toggle - only show when there are results */}
                {filteredChanges && filteredChanges.length > 0 && (
                  <div className="relative ml-3">
                    <CustomTooltip
                      content={`Enable this to filter out whitespace-only changes, for a cleaner RdLn \n\n`}
                      status={cleanWhitespace ? 'ON' : 'OFF'}
                    >
                      <button
                        onClick={handleWhitespaceToggle}
                        className={`flex items-center justify-center w-14 h-12 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-inner active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-400/60 ${
                          cleanWhitespace
                            ? 'bg-theme-primary-700 border-transparent hover:shadow-lg hover:shadow-theme-accent-200/30 shadow-theme-accent-200/20'
                            : 'bg-theme-neutral-900/20 dark:bg-theme-neutral-100/5 border-theme-neutral-600/50 dark:border-theme-neutral-400/40 hover:border-theme-neutral-500/70 dark:hover:border-theme-neutral-300/60 hover:bg-theme-neutral-800/25 dark:hover:bg-theme-neutral-100/10'
                        }`}
                        aria-label={`Toggle whitespace cleanup: ${cleanWhitespace ? 'enabled' : 'disabled'}`}
                        aria-pressed={cleanWhitespace}
                      >
                        <span className="inline-flex items-center leading-none">
                          <span
                            className="mr-0 select-none"
                            style={{ fontSize: '14px', marginLeft: '-2px' }}
                            aria-hidden="true"
                          >
                            ✨
                          </span>
                          <span
                            className={`select-none transition-all duration-300 transform ${cleanWhitespace
                              ? 'scale-110 text-white'
                              : 'scale-90 opacity-30 text-theme-neutral-500'}`}
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              lineHeight: 1,
                              marginRight: '2px'
                            }}
                          >
                            🧹
                          </span>
                        </span>
                      </button>
                    </CustomTooltip>
                    {cleanWhitespace && (
                      <span
                        className="absolute w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: 'var(--autoformat-pilcrow-on)',
                          top: '2px',
                          right: '2px'
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <FontSizeSelector />
                
                {/* Whitespace cleanup toggle - also available in overlay mode */}
                {filteredChanges && filteredChanges.length > 0 && (
                  <div className="relative">
                    <CustomTooltip
                      content={`Enable this to filter out whitespace-only changes, for a cleaner RdLn \n\n`}
                      status={cleanWhitespace ? 'ON' : 'OFF'}
                    >
                      <button
                        onClick={handleWhitespaceToggle}
                        className={`flex items-center justify-center w-14 h-12 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02] active:shadow-inner active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary-400/60 ${
                          cleanWhitespace
                            ? 'bg-theme-primary-700 border-transparent hover:shadow-lg hover:shadow-theme-accent-200/30 shadow-theme-accent-200/20'
                            : 'bg-theme-neutral-900/20 dark:bg-theme-neutral-100/5 border-theme-neutral-600/50 dark:border-theme-neutral-400/40 hover:border-theme-neutral-500/70 dark:hover:border-theme-neutral-300/60 hover:bg-theme-neutral-800/25 dark:hover:bg-theme-neutral-100/10'
                        }`}
                        aria-label={`Toggle whitespace cleanup: ${cleanWhitespace ? 'enabled' : 'disabled'}`}
                        aria-pressed={cleanWhitespace}
                      >
                        <span className="inline-flex items-center leading-none">
                          <span
                            className="mr-0 select-none"
                            style={{ fontSize: '14px', marginLeft: '-2px' }}
                            aria-hidden="true"
                          >
                            ✨
                          </span>
                          <span
                            className={`select-none transition-all duration-300 transform ${cleanWhitespace
                              ? 'scale-110 text-white'
                              : 'scale-90 opacity-30 text-theme-neutral-500'}`}
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              lineHeight: 1,
                              marginRight: '2px'
                            }}
                          >
                            🧹
                          </span>
                        </span>
                      </button>
                    </CustomTooltip>
                    {cleanWhitespace && (
                      <span
                        className="absolute w-2 h-2 rounded-full animate-pulse"
                        style={{
                          backgroundColor: 'var(--autoformat-pilcrow-on)',
                          top: '2px',
                          right: '2px'
                        }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )}
              </div>
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
            <CopyButton
              changes={filteredChanges}
              onCopy={onCopy}
            />

            {/* Copy for Word Button - Feature Flagged */}
            {FEATURE_FLAGS.ENABLE_WORD_OPTIMIZED_COPY && (
              <WordCopyButton
                changes={filteredChanges}
                onCopy={onCopy}
              />
            )}

            {/* Download DOCX Button */}
            <DocxExportButton
              changes={filteredChanges}
              chunks={chunks.map(chunk => ({
                ...chunk,
                html: FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
                  ? generateSemanticHTMLString(chunk.changes, true)
                  : generateHTMLString(chunk.changes, true)
              }))}
              documentTitle={props.documentTitle}
              originalTitle={props.originalTitle}
              revisedTitle={props.revisedTitle}
              originalText={props.originalText}
              revisedText={props.revisedText}
            />

            {/* Full Screen Button */}
            <div className="relative segmented-control">
              <FullScreenButton
                isFullScreen={isFullScreen}
                onToggle={onToggleFullScreen || (() => { })}
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
        <div 
          className="glass-input-field user-text-area font-serif text-theme-neutral-800 whitespace-pre-wrap libertinus-math-output libertinus-math-text py-6 px-8" 
          data-user-font-size={fontSize} 
          data-whitespace-mode={cleanWhitespace ? 'clean' : 'raw'}
          style={{ 
            lineHeight: '2',
            '--content-line-height': '2'
          } as React.CSSProperties}
        >
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
                chunk={chunk}
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

// Helper component for a single chunk with CSS-based toggling
const Chunk: React.FC<{ chunk: ChunkData, estimatedHeight: number, root: Element | null }> = ({ chunk, estimatedHeight, root }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const placeholderRef = React.useRef<HTMLDivElement>(null);

  // Generate both clean and raw HTML versions once
  const cleanHTML = React.useMemo(() => {
    return FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
      ? generateSemanticHTMLString(chunk.changes, true)
      : generateHTMLString(chunk.changes, true);
  }, [chunk.changes]);

  const rawHTML = React.useMemo(() => {
    return FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING
      ? generateSemanticHTMLString(chunk.changes, false)
      : generateHTMLString(chunk.changes, false);
  }, [chunk.changes]);

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
      >
        {/* Clean version - visible when whitespace-clean class is active on parent */}
        <div 
          className="chunk-version chunk-clean"
          dangerouslySetInnerHTML={{ __html: cleanHTML }}
        />
        {/* Raw version - visible when whitespace-raw class is active on parent */}
        <div 
          className="chunk-version chunk-raw"
          dangerouslySetInnerHTML={{ __html: rawHTML }}
        />
      </div>
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

// Utility function for consistent whitespace handling across all rendering modes
const renderChangedContentWithWhitespaceLogic = (
  originalContent: string, 
  revisedContent: string, 
  escapeHTML: (str: unknown) => string,
  enableCleanup: boolean = true
): string => {
  const isPureWhitespaceSubstitution = /^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent);



  // Edge case: single whitespace addition/removal (common line-ending formatting noise)
  const isSingleWhitespaceChange = (
    // Pure whitespace differences (empty, spaces, tabs)
    (/^\s*$/.test(originalContent) && /^\s*$/.test(revisedContent)) ||
    // Single space addition: "" → " "
    (originalContent === "" && revisedContent === " ") ||
    // Single space removal: " " → ""
    (originalContent === " " && revisedContent === "") ||
    // Single space substitution: " " → "  " or vice versa (different amounts of spaces)
    (/^\s+$/.test(originalContent) && /^\s+$/.test(revisedContent) && 
     Math.abs(originalContent.length - revisedContent.length) <= 2)
  );

  if (enableCleanup && (isPureWhitespaceSubstitution || isSingleWhitespaceChange)) {
    // Clean mode: render whitespace substitutions without highlighting
    return `<span>${escapeHTML(revisedContent)}</span>`;
  } else {
    // For regular substitutions: show full highlighting
    return `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(originalContent)}</span><span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(revisedContent)}</span>`;
  }
};

// Helper function to generate static HTML from changes in clean mode
const generateHTMLString = (changes: DiffChange[], enableCleanup: boolean = true) => {
  let html = '';
  changes.forEach(change => {
    const escapeHTML = (str: unknown): string => {
      if (str == null) return '';
      const stringValue = String(str);
      return stringValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/`/g, '&#x60;')
        .replace(/\n/g, '<br>'); // Convert newlines to <br> tags
    };

    switch (change.type) {
      case 'added':
        // Clean up single-character whitespace additions
        if (enableCleanup && change.content && change.content.length <= 2 && /^\s*$/.test(change.content)) {
          html += `<span>${escapeHTML(change.content)}</span>`;
        } else {
          html += `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(change.content)}</span>`;
        }
        break;
      case 'removed':
        // Clean up single-character whitespace removals
        if (enableCleanup && change.content && change.content.length <= 2 && /^\s*$/.test(change.content)) {
          // Render nothing for removed whitespace
        } else {
          html += `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(change.content)}</span>`;
        }
        break;
      case 'changed':
        const originalContent = change.originalContent || '';
        const revisedContent = change.revisedContent || '';
        html += renderChangedContentWithWhitespaceLogic(originalContent, revisedContent, escapeHTML, enableCleanup);
        break;
      default:
        html += `<span>${escapeHTML(change.content)}</span>`;
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

const renderChangeGroup = (group: DiffChange[], type: string, enableCleanup: boolean = true) => {
  const escapeHTML = (str: unknown): string => {
    if (str == null) return '';
    const stringValue = String(str);
    return stringValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;')
      .replace(/\n/g, '<br>'); // Convert newlines to <br> tags
  };

  if (type === 'changed') {
    // For changed type, combine all original content and all revised content
    const combinedOriginal = group.map(change => change.originalContent || '').join('');
    const combinedRevised = group.map(change => change.revisedContent || '').join('');

    // Use shared whitespace logic for consistent behavior
    return renderChangedContentWithWhitespaceLogic(combinedOriginal, combinedRevised, escapeHTML, enableCleanup);
  } else {
    // For added/removed, combine content
    const combinedContent = group.map(change => change.content || '').join('');
    const styleAttr = type === 'added'
      ? 'background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; '
      : 'background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ';

    return `<span style="${styleAttr}">${escapeHTML(combinedContent)}</span>`;
  }
};

const renderSingleChange = (change: DiffChange, enableCleanup: boolean = true) => {
  // Use existing logic for single changes
  const escapeHTML = (str: unknown): string => {
    if (str == null) return '';
    const stringValue = String(str);
    return stringValue
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;')
      .replace(/\n/g, '<br>'); // Convert newlines to <br> tags
  };

  switch (change.type) {
    case 'added':
      // Clean up single-character whitespace additions
      if (enableCleanup && change.content && change.content.length <= 2 && /^\s*$/.test(change.content)) {
        return `<span>${escapeHTML(change.content)}</span>`;
      }
      return `<span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%); color: #14532d; border: 1px solid #16a34a; border-radius: 10px; text-decoration: underline; text-decoration-color: #15803d; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(change.content)}</span>`;
    case 'removed':
      // Clean up single-character whitespace removals
      if (enableCleanup && change.content && change.content.length <= 2 && /^\s*$/.test(change.content)) {
        return `<span></span>`; // Render nothing for removed whitespace
      }
      return `<span style="background: linear-gradient(135deg, #fef7f7 0%, #fde2e2 100%); color: #991b1b; border: 1px solid #dc2626; border-radius: 10px; text-decoration: line-through; text-decoration-color: #b91c1c; text-decoration-thickness: 2px; font-weight: 500; padding: 3.6px 5px; margin: 1.5px 1.5px; ">${escapeHTML(change.content)}</span>`;
    case 'changed':
      const originalContent = change.originalContent || '';
      const revisedContent = change.revisedContent || '';
      return renderChangedContentWithWhitespaceLogic(originalContent, revisedContent, escapeHTML, enableCleanup);
    default:
      return `<span>${escapeHTML(change.content)}</span>`;
  }
};

// Semantic-aware HTML generation function
const generateSemanticHTMLString = (changes: DiffChange[], enableCleanup: boolean = true) => {
  // Check feature flag once at the beginning
  if (!FEATURE_FLAGS.ENABLE_SEMANTIC_CHUNKING) {
    return generateHTMLString(changes, enableCleanup); // Fallback to original
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
        html += renderChangeGroup(group, current.type, enableCleanup);
        groupsCreated++;
      } else {
        html += renderSingleChange(current, enableCleanup);
      }
      i += group.length;
    } else {
      html += renderSingleChange(current, enableCleanup);
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


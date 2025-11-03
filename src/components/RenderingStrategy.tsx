/**
 * SSMR Phase 1: Smart Thresholds & Decision Matrix
 * 
 * This component implements the two-dimensional strategy for rendering decisions:
 * - Small docs with few changes: immediate static rendering
 * - Small docs with many changes: progressive semantic chunks with final static render
 * - Large docs with few changes: stream algorithm progress with immediate static render
 * - Large docs with many changes: full pipeline with progressive rendering and final static render
 * 
 * SAFE: New component that doesn't modify existing RedlineOutput
 * MODULAR: Can be disabled by setting enabled=false
 * REVERSIBLE: Can be completely removed without affecting existing functionality
 */

import React from 'react';
import { DiffChange } from '../types';
import { BaseComponentProps } from '../types/components';

// Smart thresholds based on expert recommendations (Junio Hamano & Neil Fraser)
export const RENDERING_THRESHOLDS = {
  // Document size thresholds (characters)
  SMALL_DOC_THRESHOLD: 50000,    // 50k chars - typical legal document page
  LARGE_DOC_THRESHOLD: 200000,   // 200k chars - complex legal document
  
  // Diff complexity thresholds (number of changes)
  FEW_CHANGES_THRESHOLD: 100,    // Simple edits/corrections
  MANY_CHANGES_THRESHOLD: 1000,  // Complex revisions
  MASSIVE_CHANGES_THRESHOLD: 5000, // Major rewrites
  
  // Performance thresholds
  UI_BLOCKING_THRESHOLD: 50,     // 50ms - main thread blocking warning
  CHUNK_SIZE_PROGRESSIVE: 100,   // Progressive rendering chunk size
  CHUNK_SIZE_FINAL: 500,         // Final static rendering chunk size
  
  // Virtual scrolling thresholds
  VIRTUAL_SCROLL_THRESHOLD: 2000, // Use virtual scrolling above 2000 changes
  VIRTUAL_CHUNK_HEIGHT: 400,     // Estimated height per virtual chunk
  VIRTUAL_BUFFER_CHUNKS: 1       // Buffer chunks for smooth scrolling
} as const;

export type RenderingMode = 
  | 'immediate_static'           // Small docs, few changes
  | 'progressive_static'         // Small docs, many changes
  | 'stream_static'             // Large docs, few changes  
  | 'full_pipeline'             // Large docs, many changes
  | 'virtual_scrolling'         // Massive change sets
  | 'emergency_fallback';       // Error recovery

export type RenderingState = 
  | 'analyzing'                 // Determining strategy
  | 'generating'               // Running diff algorithm
  | 'progressive'              // Progressive rendering in progress
  | 'complete'                 // Final static render complete
  | 'error';                   // Error state

export interface RenderingStrategy {
  mode: RenderingMode;
  state: RenderingState;
  documentSize: 'small' | 'medium' | 'large';
  diffComplexity: 'simple' | 'moderate' | 'complex' | 'massive';
  useVirtualScrolling: boolean;
  chunkSize: number;
  showProgress: boolean;
  enableSemanticChunking: boolean;
}

export interface RenderingDecision {
  strategy: RenderingStrategy;
  reasoning: string;
  estimatedRenderTime: number;
  recommendations: string[];
}

/**
 * Analyzes document size and diff complexity to determine optimal rendering strategy
 */
export function analyzeRenderingStrategy(
  originalText: string, 
  revisedText: string, 
  changes?: DiffChange[],
  systemProtectionEnabled?: boolean
): RenderingDecision {
  const originalSize = originalText.length;
  const revisedSize = revisedText.length;
  const avgDocSize = (originalSize + revisedSize) / 2;
  const changeCount = changes?.length || 0;
  
  // Determine document size category
  let documentSize: 'small' | 'medium' | 'large';
  if (avgDocSize <= RENDERING_THRESHOLDS.SMALL_DOC_THRESHOLD) {
    documentSize = 'small';
  } else if (avgDocSize <= RENDERING_THRESHOLDS.LARGE_DOC_THRESHOLD) {
    documentSize = 'medium';
  } else {
    documentSize = 'large';
  }
  
  // Determine diff complexity category
  let diffComplexity: 'simple' | 'moderate' | 'complex' | 'massive';
  if (changeCount <= RENDERING_THRESHOLDS.FEW_CHANGES_THRESHOLD) {
    diffComplexity = 'simple';
  } else if (changeCount <= RENDERING_THRESHOLDS.MANY_CHANGES_THRESHOLD) {
    diffComplexity = 'moderate';
  } else if (changeCount <= RENDERING_THRESHOLDS.MASSIVE_CHANGES_THRESHOLD) {
    diffComplexity = 'complex';
  } else {
    diffComplexity = 'massive';
  }
  
  // Decision matrix based on two dimensions
  let mode: RenderingMode;
  let reasoning: string;
  let estimatedRenderTime: number;
  const recommendations: string[] = [];
  
  // Emergency fallback for massive change sets (only when system protection is enabled)
  if (changeCount > RENDERING_THRESHOLDS.MASSIVE_CHANGES_THRESHOLD * 2 && systemProtectionEnabled !== false) {
    mode = 'emergency_fallback';
    reasoning = 'Extremely large change set detected. Using emergency fallback mode to prevent UI blocking.';
    estimatedRenderTime = 1000; // 1 second
    recommendations.push('Consider comparing smaller document sections');
    recommendations.push('The documents may be fundamentally different');
    recommendations.push('System protection enabled - disable in settings for full rendering');
  }
  // Virtual scrolling for massive but manageable change sets
  else if (changeCount > RENDERING_THRESHOLDS.VIRTUAL_SCROLL_THRESHOLD) {
    mode = 'virtual_scrolling';
    reasoning = `Large change set (${changeCount} changes) requires virtual scrolling to maintain UI responsiveness.`;
    estimatedRenderTime = 2000; // 2 seconds
    recommendations.push('Virtual scrolling active for optimal performance');
  }
  // Two-dimensional decision matrix
  else if (documentSize === 'small' && diffComplexity === 'simple') {
    mode = 'immediate_static';
    reasoning = 'Small document with simple changes can be rendered immediately without performance concerns.';
    estimatedRenderTime = 100; // 100ms
  }
  else if (documentSize === 'small' && (diffComplexity === 'moderate' || diffComplexity === 'complex')) {
    mode = 'progressive_static';
    reasoning = 'Small document with many changes will use progressive rendering followed by static final render.';
    estimatedRenderTime = 800; // 800ms
    recommendations.push('Progressive chunks will preserve readability');
  }
  else if ((documentSize === 'medium' || documentSize === 'large') && diffComplexity === 'simple') {
    mode = 'stream_static';
    reasoning = 'Large document with simple changes will stream algorithm progress then render statically.';
    estimatedRenderTime = 600; // 600ms
    recommendations.push('Algorithm progress will be shown during processing');
  }
  else {
    mode = 'full_pipeline';
    reasoning = 'Large document with complex changes requires full progressive pipeline for optimal user experience.';
    estimatedRenderTime = 1500; // 1.5 seconds
    recommendations.push('Full progressive rendering pipeline active');
    recommendations.push('Final static render will be smooth and readable');
  }
  
  // Determine specific strategy settings
  const useVirtualScrolling = mode === 'virtual_scrolling' || changeCount > RENDERING_THRESHOLDS.VIRTUAL_SCROLL_THRESHOLD;
  const chunkSize = mode === 'progressive_static' || mode === 'full_pipeline' 
    ? RENDERING_THRESHOLDS.CHUNK_SIZE_PROGRESSIVE 
    : RENDERING_THRESHOLDS.CHUNK_SIZE_FINAL;
  const showProgress = mode !== 'immediate_static';
  const enableSemanticChunking = mode === 'progressive_static' || mode === 'full_pipeline';
  
  const strategy: RenderingStrategy = {
    mode,
    state: 'analyzing',
    documentSize,
    diffComplexity,
    useVirtualScrolling,
    chunkSize,
    showProgress,
    enableSemanticChunking
  };
  
  return {
    strategy,
    reasoning,
    estimatedRenderTime,
    recommendations
  };
}

/**
 * Creates semantic chunks that avoid breaking words, sentences, or paragraphs
 */
export function createSemanticChunks(changes: DiffChange[], chunkSize: number): DiffChange[][] {
  if (changes.length <= chunkSize) {
    return [changes];
  }
  
  const chunks: DiffChange[][] = [];
  let currentChunk: DiffChange[] = [];
  
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    currentChunk.push(change);
    
    // Check if we should break the chunk
    if (currentChunk.length >= chunkSize) {
      // Look for a good breaking point (end of sentence, paragraph, or word)
      const breakPoint = findSemanticBreakPoint(changes, i, chunkSize);
      
      if (breakPoint > i) {
        // Add remaining changes to current chunk up to break point
        while (i < breakPoint && i < changes.length - 1) {
          i++;
          currentChunk.push(changes[i]);
        }
      }
      
      chunks.push(currentChunk);
      currentChunk = [];
    }
  }
  
  // Add remaining changes
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Finds the optimal break point for semantic chunking
 */
function findSemanticBreakPoint(changes: DiffChange[], currentIndex: number, chunkSize: number): number {
  const lookAheadLimit = Math.min(chunkSize * 0.3, 50); // Look ahead up to 30% of chunk size or 50 changes
  let bestBreakPoint = currentIndex;
  
  for (let i = currentIndex; i < Math.min(currentIndex + lookAheadLimit, changes.length); i++) {
    const change = changes[i];
    const content = change.content || change.revisedContent || '';
    
    // Paragraph break (double newline or paragraph tag)
    if (content.includes('\n\n') || content.includes('</p>') || content.includes('<p>')) {
      return i;
    }
    
    // Sentence break (period, exclamation, question mark followed by space or newline)
    if (/[.!?]\s+/.test(content) || /[.!?]\n/.test(content)) {
      bestBreakPoint = i;
    }
    
    // Word break (space or punctuation)
    if (/\s+/.test(content) || /[,;:]/.test(content)) {
      bestBreakPoint = i;
    }
  }
  
  return bestBreakPoint;
}

/**
 * Progress feedback component for rendering operations
 */
interface RenderingProgressProps {
  strategy: RenderingStrategy;
  progress: number;
  stage: string;
  enabled?: boolean;
  className?: string;
}

export const RenderingProgress: React.FC<RenderingProgressProps> = ({
  strategy,
  progress,
  stage,
  enabled = true,
  className = ''
}) => {
  if (!enabled || !strategy.showProgress) {
    return null;
  }
  
  const getProgressColor = () => {
    switch (strategy.state) {
      case 'analyzing': return 'bg-blue-500';
      case 'generating': return 'bg-yellow-500';
      case 'progressive': return 'bg-green-500';
      case 'complete': return 'bg-green-600';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStateLabel = () => {
    switch (strategy.state) {
      case 'analyzing': return 'Analyzing document complexity...';
      case 'generating': return 'Generating diff...';
      case 'progressive': return 'Rendering progressively...';
      case 'complete': return 'Complete';
      case 'error': return 'Error occurred';
      default: return 'Processing...';
    }
  };
  
  return (
    <div className={`glass-panel p-3 border border-theme-primary-200 rounded-lg shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-theme-primary-900">
          {getStateLabel()}
        </div>
        <div className="text-xs text-theme-neutral-600">
          {strategy.mode.replace('_', ' ')}
        </div>
      </div>
      
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-theme-neutral-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
      
      {stage && (
        <div className="text-xs text-theme-neutral-600">
          {stage}
        </div>
      )}
      
      {strategy.state === 'complete' && (
        <div className="text-xs text-theme-secondary-600 mt-1">
          ✓ Optimized for {strategy.diffComplexity} changes on {strategy.documentSize} document
        </div>
      )}
    </div>
  );
};

export default RenderingProgress;

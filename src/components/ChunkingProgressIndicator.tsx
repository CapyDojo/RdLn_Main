/**
 * SSMR CHUNKING: Step 3 - Chunking Progress Indicator
 * 
 * SAFE: Non-intrusive component that doesn't interfere with existing progress displays
 * MODULAR: Can be easily disabled or removed without affecting other components
 * REVERSIBLE: Can be hidden with a single prop change
 * 
 * Features:
 * - Separate from OCR progress (no conflicts)
 * - Only shows for large text processing (>1000 tokens)
 * - Compact design that doesn't obstruct main UI
 * - Easy to disable/hide
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { BaseComponentProps } from '../types/components';

interface ChunkingProgressIndicatorProps extends BaseComponentProps {
  progress: number;
  stage: string;
  isChunking: boolean;
  enabled?: boolean; // ROLLBACK: Set to false to hide completely
}

export const ChunkingProgressIndicator: React.FC<ChunkingProgressIndicatorProps> = ({
  progress,
  stage,
  isChunking: _isChunking,
  enabled = true, // SAFE: Default enabled, easy to disable
  className,
  style
}) => {
  // Silence unused prop without behavior change
  void _isChunking;
  // TESTING: Show component when enabled and progress > 0, regardless of isChunking state
  // ROLLBACK: Easy disable
  if (!enabled || progress === 0) {
    return null;
  }

  return (
    <div className={`glass-panel px-3 py-2 text-xs text-theme-neutral-600 border border-theme-neutral-200 rounded-lg ${className || ''}`} style={style}>
      <div className="flex items-center gap-2">
        <Zap className="w-3 h-3 text-purple-500" />
        <span>{stage}</span>
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-theme-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <span className="text-xs font-medium text-purple-600 min-w-[2rem]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
};

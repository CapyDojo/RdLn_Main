/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

import React from 'react';
import { PlayCircle } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';
import { getRecommendedSample } from '../utils/sampleData';

interface BetaDemoControlsPanelProps extends BaseComponentProps {
  /** Callback when sample data should be loaded */
  onLoadSample: (originalText: string, revisedText: string, autoRun?: boolean) => void;
  /** Whether the app is currently processing */
  isProcessing: boolean;
  /** Whether inputs have content */
  hasContent: boolean;
}

/**
 * BetaDemoControlsPanel Component (v0.6.0)
 * 
 * Provides a simple Quick Demo button to instantly seed the application
 * with professional sample content and run an automatic comparison.
 */
export const BetaDemoControlsPanel: React.FC<BetaDemoControlsPanelProps> = ({
  onLoadSample,
  isProcessing,
  hasContent: _hasContent,
  style,
  className,
  ...props
}) => {
  // Silence unused prop while keeping it off the DOM
  void _hasContent;
  const handleQuickDemo = () => {
    const sample = getRecommendedSample();
    onLoadSample(sample.originalText, sample.revisedText, true); // Auto-run comparison
  };

  return (
    <div 
      className={`relative glass-panel border border-theme-primary-200 rounded-lg shadow-sm bg-theme-primary-50/80 backdrop-blur-sm transition-all duration-300 ${className || ''}`}
      style={style}
      {...props}
    >
      <div className="p-3">
        <CustomTooltip content="Try RdLn instantly with professional sample content" shortcut="Quick Demo">
          <button
            onClick={handleQuickDemo}
            disabled={isProcessing}
            className="enhanced-button flex items-center gap-2 px-4 py-2 bg-theme-primary-600 hover:bg-theme-primary-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Quick Demo</span>
            {isProcessing && (
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </CustomTooltip>
      </div>

      {/* Beta indicator */}
      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-theme-accent-500 text-white text-xs font-bold rounded-full shadow-sm">
        BETA
      </div>
    </div>
  );
};

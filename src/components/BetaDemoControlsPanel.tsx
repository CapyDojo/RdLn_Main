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

import React, { useState } from 'react';
import { PlayCircle, Zap, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';
import { getSampleForDemo, getRecommendedSample, SAMPLE_DATA, SampleData } from '../utils/sampleData';

interface BetaDemoControlsPanelProps extends BaseComponentProps {
  /** Callback when sample data should be loaded */
  onLoadSample: (originalText: string, revisedText: string, autoRun?: boolean) => void;
  /** Whether the app is currently processing */
  isProcessing: boolean;
  /** Whether inputs have content */
  hasContent: boolean;
}

/**
 * BetaDemoControlsPanel Component
 * 
 * Provides demo and sample loading controls positioned in the header area.
 * Non-intrusive design that showcases both auto and manual comparison workflows.
 */
export const BetaDemoControlsPanel: React.FC<BetaDemoControlsPanelProps> = ({
  onLoadSample,
  isProcessing,
  hasContent,
  style,
  className,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleData>(getRecommendedSample());

  const handleQuickDemo = () => {
    const sample = getRecommendedSample();
    onLoadSample(sample.originalText, sample.revisedText, true); // Auto-run comparison
  };

  const handleLoadSample = (autoRun: boolean = false) => {
    onLoadSample(selectedSample.originalText, selectedSample.revisedText, autoRun);
  };

  const handleSampleChange = (sampleId: string) => {
    const sample = SAMPLE_DATA.find(s => s.id === sampleId);
    if (sample) {
      setSelectedSample(sample);
    }
  };

  return (
    <div 
      className={`glass-panel border border-theme-primary-200 rounded-lg shadow-sm bg-theme-primary-50/80 backdrop-blur-sm transition-all duration-300 ${className || ''}`}
      style={style}
      {...props}
    >
      <div className="p-3">
        {/* Main controls - always visible */}
        <div className="flex items-center gap-2">
          <CustomTooltip content="Try RdLn instantly with professional sample content" shortcut="Quick Demo">
            <button
              onClick={handleQuickDemo}
              disabled={isProcessing}
              className="enhanced-button flex items-center gap-2 px-3 py-2 bg-theme-primary-600 hover:bg-theme-primary-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Quick Demo</span>
              {isProcessing && (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          </CustomTooltip>

          <CustomTooltip content={isExpanded ? "Hide demo options" : "Show more demo options"}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="enhanced-button flex items-center justify-center w-8 h-8 bg-theme-primary-100 hover:bg-theme-primary-200 text-theme-primary-700 rounded-lg transition-all duration-200 shadow-sm"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </CustomTooltip>
        </div>

        {/* Expanded controls */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-theme-primary-200">
            {/* Sample selector */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-theme-primary-800 mb-1">
                Sample Document:
              </label>
              <select
                value={selectedSample.id}
                onChange={(e) => handleSampleChange(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-theme-primary-200 rounded bg-white text-theme-primary-800 focus:outline-none focus:ring-2 focus:ring-theme-primary-400 focus:border-transparent"
              >
                {SAMPLE_DATA.map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.title} - {sample.complexity}
                  </option>
                ))}
              </select>
            </div>

            {/* Sample description */}
            <div className="mb-3 p-2 bg-white/60 rounded border border-theme-primary-100">
              <p className="text-xs text-theme-primary-700 leading-relaxed">
                {selectedSample.description}
              </p>
              <div className="flex gap-1 mt-1">
                {selectedSample.changeTypes.slice(0, 2).map(type => (
                  <span 
                    key={type}
                    className="inline-flex items-center px-1.5 py-0.5 text-xs bg-theme-primary-100 text-theme-primary-600 rounded"
                  >
                    {type}
                  </span>
                ))}
                {selectedSample.changeTypes.length > 2 && (
                  <span className="text-xs text-theme-primary-500">
                    +{selectedSample.changeTypes.length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <CustomTooltip content="Load sample and run comparison automatically" shortcut="Auto Mode">
                <button
                  onClick={() => handleLoadSample(true)}
                  disabled={isProcessing}
                  className="enhanced-button flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-theme-accent-500 hover:bg-theme-accent-600 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Auto Demo
                </button>
              </CustomTooltip>

              <CustomTooltip content="Load sample for manual comparison" shortcut="Manual Mode">
                <button
                  onClick={() => handleLoadSample(false)}
                  disabled={isProcessing}
                  className="enhanced-button flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-theme-secondary-500 hover:bg-theme-secondary-600 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Load Sample
                </button>
              </CustomTooltip>
            </div>
          </div>
        )}
      </div>

      {/* Beta indicator */}
      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-theme-accent-500 text-white text-xs font-bold rounded-full shadow-sm">
        BETA
      </div>
    </div>
  );
};
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
import { BetaDemoControlsPanel } from './BetaDemoControlsPanel';
import { BaseComponentProps } from '../types/components';

interface DemoBentoCardProps extends BaseComponentProps {
  /** Whether the card should be visible */
  visible?: boolean;
  /** Callback when sample data should be loaded */
  onLoadSample: (originalText: string, revisedText: string, autoRun?: boolean) => void;
  /** Whether the app is currently processing */
  isProcessing: boolean;
  /** Whether inputs have content */
  hasContent: boolean;
}

/**
 * DemoBentoCard Component
 * 
 * A bento card containing demo controls, positioned on the main canvas
 * rather than in the header for better UX and visual prominence.
 */
export const DemoBentoCard: React.FC<DemoBentoCardProps> = ({
  visible = true,
  onLoadSample,
  isProcessing,
  hasContent,
  style,
  className,
  ...props
}) => {
  if (!visible) return null;

  return (
    <div 
      className={`${className || ''}`}
      style={style}
      {...props}
    >
      <BetaDemoControlsPanel
        onLoadSample={onLoadSample}
        isProcessing={isProcessing}
        hasContent={hasContent}
      />
    </div>
  );
};
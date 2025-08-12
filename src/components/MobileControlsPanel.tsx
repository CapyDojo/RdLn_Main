import React from 'react';
import { Play, RotateCcw, ArrowLeftRight, Zap, ZapOff, Lock, Undo } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';

interface MobileControlsPanelProps extends BaseComponentProps {
  /** Whether Quick Compare is enabled */
  quickCompareEnabled: boolean;
  /** Whether scroll lock is active */
  isScrollLocked: boolean;
  /** Whether currently processing */
  isProcessing: boolean;
  /** Original text content */
  originalText: string;
  /** Revised text content */
  revisedText: string;
  /** Callback for compare button */
  onCompare: () => void;
  /** Callback for toggle quick compare */
  onToggleQuickCompare: () => void;
  /** Callback for swap content */
  onSwapContent: () => void;
  /** Callback for toggle scroll lock */
  onToggleScrollLock: () => void;
  /** Callback for reset comparison */
  onResetComparison: () => void;
  /** Whether undo is available */
  canUndo?: boolean;
  /** Callback for undo action */
  onUndo?: () => void;
  /** Content length for smart clear warnings */
  contentLength?: number;
}

/**
 * Mobile Controls Panel Component
 * 
 * Contains all the control buttons for mobile layout with horizontal arrangement.
 * Extracted from ComparisonInterface for better modularity and reusability.
 */
export const MobileControlsPanel: React.FC<MobileControlsPanelProps> = ({
  quickCompareEnabled,
  isScrollLocked,
  isProcessing,
  originalText,
  revisedText,
  onCompare,
  onToggleQuickCompare,
  onSwapContent,
  onToggleScrollLock,
  onResetComparison,
  canUndo = false,
  onUndo,
  contentLength = 0,
  style,
  className
}) => {
  return (
    <div style={style} className={className}>
      {/* Mobile Controls - Enhanced with all operation buttons */}
      <div className="lg:hidden text-center">
        <div className="inline-flex flex-wrap justify-center items-center gap-3 mt-4">
          {/* Compare Button - Only show when live compare is disabled */}
          {!quickCompareEnabled && (
            <CustomTooltip 
              content={isProcessing ? 'Processing comparison...' : 'Compare documents'}
              shortcut="Alt+Enter"
            >
              <button
                data-compare-button
                onClick={onCompare}
                disabled={isProcessing || !originalText.trim() || !revisedText.trim()}
                className="enhanced-button flex items-center gap-2 px-4 py-2.5 bg-theme-primary-600 text-white rounded-lg hover:bg-theme-primary-700 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                <Play className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Compare'}</span>
              </button>
            </CustomTooltip>
          )}
          
          {/* Live Compare Toggle */}
          <CustomTooltip 
            content={quickCompareEnabled ? 'Live Compare mode - ON' : 'Live Compare mode - OFF'}
            shortcut="Alt+L"
          >
            <button
              data-live-compare-toggle
              onClick={onToggleQuickCompare}
              className={`enhanced-button flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg relative overflow-visible ${
                quickCompareEnabled 
                  ? 'bg-theme-accent-500 text-white hover:bg-theme-accent-600' 
                  : 'bg-theme-neutral-300 text-theme-neutral-700 hover:bg-theme-neutral-400'
              }`}
            >
              {quickCompareEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              <span>Live</span>
              {quickCompareEnabled && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse z-20 border-2 border-white shadow-lg"></div>
              )}
            </button>
          </CustomTooltip>
          
          {/* Swap Content Button */}
          <CustomTooltip 
            content="Swap panels"
            shortcut="Alt+W"
          >
            <button
              data-swap-content-button-mobile
              onClick={onSwapContent}
              disabled={isProcessing || (!originalText.trim() && !revisedText.trim())}
              className="enhanced-button flex items-center gap-2 px-4 py-2.5 bg-theme-secondary-500 text-white rounded-lg hover:bg-theme-secondary-600 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Swap</span>
            </button>
          </CustomTooltip>
          
          {/* Scroll Lock Button */}
          <CustomTooltip 
            content={isScrollLocked ? 'Scroll Lock - ON' : 'Scroll Lock - OFF'}
            shortcut="Alt+D"
          >
            <button
              data-scroll-lock-toggle
              onClick={onToggleScrollLock}
              className={`enhanced-button flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 shadow-lg relative overflow-visible ${
                isScrollLocked 
                  ? 'bg-theme-primary-500 text-white hover:bg-theme-primary-600' 
                  : 'bg-theme-neutral-300 text-theme-neutral-700 hover:bg-theme-neutral-400'
              }`}
            >
              <Lock className={`w-4 h-4 transition-all duration-300 ${isScrollLocked ? '' : 'opacity-60'}`} />
              <span>Scroll</span>
              {isScrollLocked && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-pulse z-20 border-2 border-white shadow-lg"></div>
              )}
            </button>
          </CustomTooltip>
        </div>
      </div>
      
      {/* Prominent Undo Button - Show when undo is available */}
      {canUndo && onUndo && (
        <div className="lg:hidden flex justify-center mt-4">
          <CustomTooltip 
            content="Undo last clear"
            shortcut="Ctrl+Z"
          >
            <button
              data-undo-button
              onClick={onUndo}
              className="enhanced-button flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200 shadow-lg border-2 border-orange-300 animate-pulse hover:animate-none relative min-h-12"
            >
              <Undo className="w-5 h-5" />
              <span className="font-semibold">⚡ UNDO CLEAR</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full animate-ping"></div>
            </button>
          </CustomTooltip>
        </div>
      )}
      
      {/* Enhanced Mobile Clear Button - Larger touch target, better visual prominence */}
      <div className="lg:hidden flex justify-center mt-6">
        <CustomTooltip 
          content={contentLength > 1000 
            ? `Clear all content (${Math.floor(contentLength/1000)}k chars) - Undo available` 
            : 'Clear all content and reset comparison - Undo available'}
          shortcut="Alt+Del"
        >
          <button
            data-reset-button
            onClick={onResetComparison}
            className="enhanced-button flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg border-3 border-red-300 hover:border-red-200 active:scale-95 min-h-12"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="font-semibold">⚠️ Clear All</span>
          </button>
        </CustomTooltip>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, RotateCcw, ArrowLeftRight, Zap, ZapOff, Lock, Undo } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';

interface DesktopControlsPanelProps extends BaseComponentProps {
  /** Whether Quick Compare is enabled */
  quickCompareEnabled: boolean;
  /** Whether scroll lock is active */
  isScrollLocked: boolean;
  /** Whether system protection is enabled */
  systemProtectionEnabled: boolean;
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
  /** Callback for toggle system protection */
  onToggleSystemProtection: () => void;
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
 * Desktop Controls Panel Component
 * 
 * Contains all the control buttons for desktop layout positioned in the center.
 * Extracted from ComparisonInterface for better modularity and reusability.
 */
export const DesktopControlsPanel: React.FC<DesktopControlsPanelProps> = ({
  quickCompareEnabled,
  isScrollLocked,
  systemProtectionEnabled,
  isProcessing,
  originalText,
  revisedText,
  onCompare,
  onToggleQuickCompare,
  onSwapContent,
  onToggleScrollLock,
  onToggleSystemProtection,
  onResetComparison,
  canUndo = false,
  onUndo,
  contentLength = 0,
  style,
  className
}) => {
  return (
    <div className={`hidden lg:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 ${className || ''}`} style={style}>
      <div className="flex flex-col gap-3">
        {/* Compare Button - Only show when live compare is disabled */}
        {!quickCompareEnabled && (
          <CustomTooltip 
            content={isProcessing ? 'Processing...' : 'Compare'}
            shortcut="Alt+Enter"
          >
            <button
              data-compare-button
              onClick={onCompare}
              disabled={isProcessing || !originalText.trim() || !revisedText.trim()}
              className="enhanced-button flex items-center justify-center w-12 h-12 bg-theme-primary-600 text-white rounded-full hover:bg-theme-primary-700 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl relative"
            >
              <Play className="w-5 h-5" />
              {isProcessing && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-theme-primary-300 rounded-full animate-pulse"></div>
              )}
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
            className={`enhanced-button flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl relative ${
              quickCompareEnabled 
                ? 'bg-theme-accent-500 text-white hover:bg-theme-accent-600' 
                : 'bg-theme-neutral-300 text-theme-neutral-700 hover:bg-theme-neutral-400'
            }`}
          >
            {quickCompareEnabled ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            {quickCompareEnabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-theme-accent-300 rounded-full animate-pulse"></div>
            )}
          </button>
        </CustomTooltip>
        
        {/* Swap Content Button */}
        <CustomTooltip 
          content="Swap panels"
          shortcut="Alt+W"
        >
          <button
            data-swap-content-button
            onClick={onSwapContent}
            disabled={isProcessing || (!originalText.trim() && !revisedText.trim())}
            className="enhanced-button flex items-center justify-center w-12 h-12 bg-theme-secondary-500 text-white rounded-full hover:bg-theme-secondary-600 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftRight className="w-5 h-5" />
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
            className={`enhanced-button flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl relative ${
              isScrollLocked 
                ? 'bg-theme-primary-500 text-white hover:bg-theme-primary-600' 
                : 'bg-theme-neutral-300 text-theme-neutral-700 hover:bg-theme-neutral-400'
            }`}
          >
            <Lock className={`w-5 h-5 transition-all duration-300 ${isScrollLocked ? '' : 'opacity-60'}`} />
            {isScrollLocked && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-theme-primary-300 rounded-full animate-pulse"></div>
            )}
          </button>
        </CustomTooltip>
        
        {/* System Protection Toggle for stress testing - HIDDEN FOR BETA */}
        {/* <button
          data-system-protection-toggle
          onClick={onToggleSystemProtection}
          className={`enhanced-button flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl text-lg ${
            systemProtectionEnabled 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
          title={systemProtectionEnabled ? 'System protection enabled - safe mode with resource limits' : 'System protection disabled - stress testing mode (may crash browser!)'}
        >
          🛡️
        </button> */}
        
        {/* Prominent Undo Button - Show when undo is available */}
        {canUndo && onUndo && (
          <CustomTooltip 
            content="Undo last clear"
            shortcut="Ctrl+Z"
          >
            <button
              data-undo-button
              onClick={onUndo}
              className="enhanced-button flex items-center justify-center w-14 h-14 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-orange-300 animate-pulse hover:animate-none relative"
            >
              <Undo className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-300 rounded-full animate-ping"></div>
            </button>
          </CustomTooltip>
        )}
        
        {/* Spacer to separate dangerous action */}
        <div className="h-4"></div>
        
        {/* Enhanced Clear Button - Larger hit-box, better visual prominence */}
        <CustomTooltip 
          content={contentLength > 1000 
            ? `Clear all (${Math.floor(contentLength/1000)}k chars)` 
            : 'Clear all content'}
          shortcut="Alt+Del"
        >
          <button
            data-reset-button
            onClick={onResetComparison}
            className="enhanced-button flex items-center justify-center w-14 h-14 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl border-3 border-red-300 hover:border-red-200 active:scale-95"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </CustomTooltip>
      </div>
    </div>
  );
};

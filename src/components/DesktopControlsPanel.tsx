import React from 'react';
import { Play, Trash2, ArrowLeftRight, Zap, ZapOff, Lock, Undo, FileText } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';

interface DesktopControlsPanelProps extends BaseComponentProps {
  quickCompareEnabled: boolean;
  isScrollLocked: boolean;
  systemProtectionEnabled: boolean;
  isProcessing: boolean;
  isLaunchingWordCompare?: boolean;
  originalText: string;
  revisedText: string;
  onCompare: () => void;
  onCompareInWord?: () => void;
  compareInWordDisabledReason?: string | null;
  compareInWordStatusMessage?: string | null;
  showCompareInWord?: boolean;
  onToggleQuickCompare: () => void;
  onSwapContent: () => void;
  onToggleScrollLock: () => void;
  onToggleSystemProtection: () => void;
  onResetComparison: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
  contentLength?: number;
}

export const DesktopControlsPanel: React.FC<DesktopControlsPanelProps> = ({
  quickCompareEnabled,
  isScrollLocked,
  systemProtectionEnabled,
  isProcessing,
  isLaunchingWordCompare = false,
  originalText,
  revisedText,
  onCompare,
  onCompareInWord,
  compareInWordDisabledReason = null,
  compareInWordStatusMessage = null,
  showCompareInWord = false,
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
  const compareInWordTooltip = compareInWordDisabledReason || (isLaunchingWordCompare ? 'Microsoft Word is launching...' : 'Launch Microsoft Word for Native Compare');

  return (
    <div className={`hidden lg:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 ${className || ''}`} style={style}>
      <div className="flex flex-col items-center gap-3">
        {!quickCompareEnabled && (
          <CustomTooltip content={isProcessing ? 'Processing...' : 'Compare'} shortcut="Alt+Enter">
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

        {showCompareInWord && onCompareInWord && (
          <CustomTooltip content={compareInWordTooltip}>
            <button
              data-compare-in-word-button
              onClick={onCompareInWord}
              disabled={isProcessing || isLaunchingWordCompare || !!compareInWordDisabledReason}
              className="enhanced-button flex items-center justify-center w-12 h-12 bg-theme-accent-700 text-white rounded-full hover:bg-theme-accent-800 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl relative"
            >
              <FileText className="w-5 h-5" />
              {isLaunchingWordCompare && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-theme-accent-300 rounded-full animate-pulse"></div>
              )}
            </button>
          </CustomTooltip>
        )}

        {showCompareInWord && compareInWordStatusMessage && (
          <div className="max-w-[11rem] text-center text-[11px] leading-4 text-theme-neutral-700">
            {compareInWordStatusMessage}
          </div>
        )}

        <CustomTooltip content={quickCompareEnabled ? 'Live Compare mode - ON' : 'Live Compare mode - OFF'} shortcut="Alt+L">
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

        <CustomTooltip content="Swap panels" shortcut="Alt+W">
          <button
            data-swap-content-button
            onClick={onSwapContent}
            disabled={isProcessing || (!originalText.trim() && !revisedText.trim())}
            className="enhanced-button flex items-center justify-center w-12 h-12 bg-theme-secondary-500 text-white rounded-full hover:bg-theme-secondary-600 disabled:bg-theme-neutral-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </CustomTooltip>

        <CustomTooltip content={isScrollLocked ? 'Lock scroll between input and output panels - ON' : 'Lock scroll between input and output panels - OFF'} shortcut="Alt+D">
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

        {canUndo && onUndo && (
          <CustomTooltip content="Undo last clear" shortcut="Ctrl+Z">
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

        <div className="h-4"></div>

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
            <Trash2 className="w-6 h-6" />
          </button>
        </CustomTooltip>
      </div>
    </div>
  );
};


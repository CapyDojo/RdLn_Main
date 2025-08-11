import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { CustomTooltip } from './CustomTooltip';

interface FullScreenButtonProps {
  isFullScreen: boolean;
  onToggle: () => void;
  className?: string;
  hasResults: boolean;
}

/**
 * FullScreenButton - Toggle button for full screen results overlay
 * 
 * Provides a clean button to toggle the results display between normal view
 * and full screen overlay mode.
 */
export const FullScreenButton: React.FC<FullScreenButtonProps> = ({
  isFullScreen,
  onToggle,
  className = '',
  hasResults
}) => {
  if (!hasResults) return null;

  return (
    <CustomTooltip content={isFullScreen ? "Return to normal view" : "Open results in full-screen"}>
      <button
      onClick={onToggle}
      className={`
        flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment
        ${className}
      `}
      style={{
        width: '48px',
        height: '48px',
        aspectRatio: '1/1',
      }}
      aria-label={isFullScreen ? "Return to normal view" : "Open results in full-screen"}
    >
      <div className="flex flex-col items-center justify-center">
        {isFullScreen ? (
          <Minimize2 className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
        ) : (
          <Maximize2 className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
        )}
        <span className="text-xs mt-0.5 hidden sm:block transition-all duration-300">
          {isFullScreen ? 'Exit' : 'Full'}
        </span>
      </div>
      </button>
    </CustomTooltip>
  );
};

/**
 * Compact version for mobile or space-constrained layouts
 */
export const FullScreenButtonCompact: React.FC<FullScreenButtonProps> = ({
  isFullScreen,
  onToggle,
  className = '',
  hasResults
}) => {
  if (!hasResults) return null;

  return (
    <CustomTooltip content={isFullScreen ? "Return to normal view" : "Open results in full-screen"}>
      <button
      onClick={onToggle}
      className={`
        flex items-center justify-center rounded-lg transition-all duration-300 shrink-0 relative group segment
        ${className}
      `}
      style={{
        width: '48px',
        height: '48px',
        aspectRatio: '1/1',
      }}
      aria-label={isFullScreen ? "Return to normal view" : "Open results in full-screen"}
    >
      <div className="flex flex-col items-center justify-center">
        {isFullScreen ? (
          <Minimize2 className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
        ) : (
          <Maximize2 className="w-6 h-6 transition-all duration-300" aria-hidden="true" />
        )}
        <span className="text-xs mt-0.5 hidden sm:block transition-all duration-300">
          {isFullScreen ? 'Exit' : 'Full'}
        </span>
      </div>
      </button>
    </CustomTooltip>
  );
};
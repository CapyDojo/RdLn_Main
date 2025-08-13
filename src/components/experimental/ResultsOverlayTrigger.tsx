import React from 'react';
import { Maximize2, Eye, Minimize2 } from 'lucide-react';

interface ResultsOverlayTriggerProps {
  isVisible: boolean;
  hasResults: boolean;
  onClick: () => void;
  className?: string;
  isInOverlayMode?: boolean;
}

/**
 * ResultsOverlayTrigger - Manual trigger for Results Overlay
 * 
 * Provides a button to manually open the results overlay.
 * Integrated with RedlineOutput header for easy access.
 */
export const ResultsOverlayTrigger: React.FC<ResultsOverlayTriggerProps> = ({
  isVisible,
  hasResults,
  onClick,
  className = '',
  isInOverlayMode = false
}) => {
  if (!isVisible || !hasResults) return null;

  // If in overlay mode, show return to normal view button
  if (isInOverlayMode) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 
          bg-orange-50 hover:bg-orange-100 
          text-orange-600 hover:text-orange-700 
          border border-orange-200 hover:border-orange-300 
          rounded-md transition-all duration-200 
          text-sm font-medium 
          hover:scale-105 
          ${className}
        `}
        title="Return to normal view"
        aria-label="Return to normal view"
      >
        <Minimize2 className="w-4 h-4" />
        <span>Normal View</span>
      </button>
    );
  }

  // Default: show full screen button
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        bg-blue-50 hover:bg-blue-100 
        text-blue-600 hover:text-blue-700 
        border border-blue-200 hover:border-blue-300 
        rounded-md transition-all duration-200 
        text-sm font-medium 
        hover:scale-105 
        ${className}
      `}
      title="Open RdLn in full-screen overlay"
      aria-label="Open RdLn in full-screen overlay"
    >
      <Maximize2 className="w-4 h-4" />
      <span>Full Screen</span>
    </button>
  );
};

/**
 * Compact version for mobile or space-constrained layouts
 */
export const ResultsOverlayTriggerCompact: React.FC<ResultsOverlayTriggerProps> = ({
  isVisible,
  hasResults,
  onClick,
  className = '',
  isInOverlayMode = false
}) => {
  if (!isVisible || !hasResults) return null;

  // If in overlay mode, show return to normal view button
  if (isInOverlayMode) {
    return (
      <button
        onClick={onClick}
        className={`
          inline-flex items-center justify-center 
          w-8 h-8 
          bg-orange-50 hover:bg-orange-100 
          text-orange-600 hover:text-orange-700 
          border border-orange-200 hover:border-orange-300 
          rounded-md transition-all duration-200 
          hover:scale-105 
          ${className}
        `}
        title="Return to normal view"
        aria-label="Return to normal view"
      >
        <Minimize2 className="w-4 h-4" />
      </button>
    );
  }

  // Default: show full screen button
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center 
        w-8 h-8 
        bg-blue-50 hover:bg-blue-100 
        text-blue-600 hover:text-blue-700 
        border border-blue-200 hover:border-blue-300 
        rounded-md transition-all duration-200 
        hover:scale-105 
        ${className}
      `}
      title="Open RdLn in full-screen overlay"
      aria-label="Open RdLn in full-screen overlay"
    >
      <Eye className="w-4 h-4" />
    </button>
  );
};

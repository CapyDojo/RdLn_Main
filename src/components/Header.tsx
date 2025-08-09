import React from 'react';
import { ThemeSelector } from './ThemeSelector';
import { FontSizeSelector } from './FontSizeSelector';
import { BetaDemoControlsPanel } from './BetaDemoControlsPanel';
import { BaseComponentProps } from '../types/components';

interface HeaderProps extends BaseComponentProps {
  /** Whether demo controls should be shown */
  showDemoControls?: boolean;
  /** Callback when sample data should be loaded */
  onLoadSample?: (originalText: string, revisedText: string, autoRun?: boolean) => void;
  /** Whether the app is currently processing */
  isProcessing?: boolean;
  /** Whether inputs have content */
  hasContent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  showDemoControls = true,
  onLoadSample,
  isProcessing = false,
  hasContent = false,
  style, 
  className 
}) => {
  return (
    <header className={`floating-header ${className || ''}`} style={style}>
      <nav className="glass-panel rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300">
        <div className="relative flex items-center">
          {/* Left Controls */}
          <div className="absolute left-0 flex items-center gap-3">
            {showDemoControls && onLoadSample && (
              <BetaDemoControlsPanel
                onLoadSample={onLoadSample}
                isProcessing={isProcessing}
                hasContent={hasContent}
              />
            )}
            <FontSizeSelector />
          </div>

          {/* Logo Section - Centered */}
          <div className="w-full flex items-center justify-center">
            <img 
              src={window.isElectron ? "./images/rdln-logo.png" : "/images/rdln-logo.png"} 
              alt="RdLn™ Logo" 
              title="RdLn™ - Professional Document Comparison Tool"
              className="object-contain rounded-3xl shadow-md transform hover:scale-105 transition-all duration-200"
              style={{ flexShrink: 0, aspectRatio: '1/1', width: '72px', height: '72px' }}
            />
          </div>
          
          {/* Right Controls */}
          <div className="absolute right-0 flex items-center gap-3">
            <ThemeSelector />
          </div>
        </div>
      </nav>
    </header>
  );
};

import React from 'react';
import { ThemeSelector } from './ThemeSelector';
import { BaseComponentProps } from '../types/components';

export const Header: React.FC<BaseComponentProps> = ({ style, className }) => {
  return (
    <header className={`floating-header ${className || ''}`} style={style}>
      <nav className="glass-panel rounded-xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg border border-white/20 backdrop-blur-xl transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3 flex-grow justify-center">
            <img 
              src="/images/rdln-logo.png" 
              alt="RdLn Logo" 
              className="object-contain rounded-3xl shadow-md transform hover:scale-105 transition-all duration-200"
              style={{ flexShrink: 0, aspectRatio: '1/1', width: '72px', height: '72px' }}
            />
          </div>
          

          {/* Controls */}
          <div className="flex items-center gap-3">
            <ThemeSelector />
          </div>
        </div>
      </nav>
    </header>
  );
};

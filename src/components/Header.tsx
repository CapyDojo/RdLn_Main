import React from 'react';
import { ThemeSelector } from './ThemeSelector';
import { FontSizeSelector } from './FontSizeSelector';
import { BaseComponentProps } from '../types/components';

// Beta countdown component
const BetaBadge: React.FC = () => {
  const BETA_EXPIRY_DATE = new Date('2025-08-31T23:59:59.999Z');
  const currentDate = new Date();
  const daysRemaining = Math.ceil((BETA_EXPIRY_DATE.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only show if beta hasn't expired
  if (currentDate > BETA_EXPIRY_DATE) {
    return null;
  }
  
  return (
    <div className="ml-3 px-2 py-1 rounded-md text-xs font-medium border text-center"
         style={{
           background: 'rgba(59, 130, 246, 0.1)',
           border: '1px solid rgba(59, 130, 246, 0.3)',
           color: '#60a5fa',
           backdropFilter: 'blur(10px)',
           lineHeight: '1.2'
         }}>
      <div>Limited Beta</div>
      <div>v.0.5.0</div>
      <div>({daysRemaining} days remaining)</div>
    </div>
  );
};

export const Header: React.FC<BaseComponentProps> = ({ style, className }) => {
  return (
    <header className={`floating-header ${className || ''}`} style={style}>
      <nav className="glass-panel rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300">
        <div className="relative flex items-center">
          {/* Left Controls */}
          <div className="absolute left-0 flex items-center gap-3">
            <FontSizeSelector />
          </div>

          {/* Logo Section - Centered */}
          <div className="w-full flex items-center justify-center">
            <div className="flex items-center">
              <img 
                src={window.isElectron ? "./images/rdln-logo.png" : "/images/rdln-logo.png"} 
                alt="RdLn™ Logo" 
                title="RdLn™ - Professional Document Comparison Tool"
                className="object-contain rounded-3xl shadow-md transform hover:scale-105 transition-all duration-200"
                style={{ flexShrink: 0, aspectRatio: '1/1', width: '72px', height: '72px' }}
              />
              <BetaBadge />
            </div>
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

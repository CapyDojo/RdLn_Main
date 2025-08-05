import React from 'react';
import { LogoTestPage } from '../pages/LogoTestPage';
import { Header } from './Header';
import { ComparisonInterface } from './ComparisonInterface';
import { useTheme } from '../contexts/ThemeContext';
import { BaseComponentProps } from '../types/components';

interface AppContentProps {
  isLogoTestPage: boolean;
}

function AppContent({ isLogoTestPage }: AppContentProps) {
  const { themeConfig } = useTheme();

  // If it's the logo test page, render only that
  if (isLogoTestPage) {
    return <LogoTestPage />;
  }

  // DEFINITIVE FIX: Remove all background classes for glassmorphic themes
  const getAppBackgroundClass = () => {
    // For themes with glassmorphism effects, return empty string (no background)
    // This allows backdrop-filter to correctly blur the document.body gradient
    if (themeConfig.effects?.glassmorphism) {
      return '';
    }
    // For solid themes, use theme-neutral background
    return 'bg-theme-neutral-50';
  };

  return (
    <div className={`min-h-screen ${getAppBackgroundClass()}`}>
      <Header />
      <ComparisonInterface />
      
      {/* Footer - Enhanced with glassmorphism to match top sections */}
      <footer className="mt-16 glass-panel border-t border-theme-neutral-200 shadow-lg transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-theme-neutral-600">
            
            
            {/* Enhanced footer features with glassmorphic styling */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm">ðŸ”’ Privacy First</h4>
                <p className="text-xs text-theme-neutral-600">
                  Client-side processing ensures complete confidentiality
                </p>
              </div>
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm">âš¡ Lightning Fast</h4>
                <p className="text-xs text-theme-neutral-600">
                  Optimized Myers algorithm for instant results
                </p>
              </div>
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm">ðŸŒ Multi-Language</h4>
                <p className="text-xs text-theme-neutral-600">
                  Advanced OCR supports 10+ languages
                </p>
              </div>
            </div>
            
            {/* Professional attribution */}
            <div className="mt-6 pt-4 border-t border-theme-neutral-200">
              <div style={{ fontFamily: 'inherit' }}>© 2025 RdLn™ - Professional Text Redlining with OCR. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const AppRouter: React.FC<BaseComponentProps> = ({ style, className }) => {
  // Simple routing logic based on pathname
  const isLogoTestPage = window.location.pathname === '/logo-test';
  
  return (
    <div className={className} style={style}>
      <AppContent isLogoTestPage={isLogoTestPage} />
    </div>
  );
};

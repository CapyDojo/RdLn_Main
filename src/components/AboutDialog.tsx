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

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useTheme();
  const currentYear = new Date().getFullYear();

  // Detect if theme is light or dark
  const isLightTheme = () => {
    // Check theme name patterns
    if (themeConfig.name?.includes('light') || 
        themeConfig.name?.includes('Light') || 
        themeConfig.name?.includes('professional') || 
        themeConfig.name?.includes('bamboo')) {
      return true;
    }
    
    // Check if text body color is dark (indicates light theme)
    const textBody = themeConfig.semanticColors?.textBody;
    if (textBody && (textBody.startsWith('#1') || textBody.startsWith('#2') || textBody.startsWith('#3') || textBody.startsWith('#4'))) {
      return true;
    }
    
    return false;
  };

  // Get overlay background based on theme brightness
  const getOverlayClasses = () => {
    return isLightTheme() ? 'bg-white/70' : 'bg-black/70';
  };

  // Get appropriate modal styling based on theme
  const getModalClasses = () => {
    if (themeConfig.effects?.glassmorphism) {
      // Use glass-panel for glassmorphism themes
      return 'glass-panel';
    } else {
      // Use solid background for non-glassmorphism themes with actual theme background
      const isDarkTheme = themeConfig.name?.includes('dark') || themeConfig.name?.includes('Dark');
      
      // Use the theme's semantic colors for better consistency
      const bgClass = isDarkTheme ? 'bg-theme-neutral-800' : 'bg-theme-neutral-50';
      const borderClass = isDarkTheme ? 'border-theme-neutral-600' : 'border-theme-neutral-200';
      
      return `${bgClass} border ${borderClass} shadow-xl`;
    }
  };

  // Get inline styles for theme-specific background
  const getModalStyle = () => {
    if (!themeConfig.effects?.glassmorphism && themeConfig.background) {
      // For non-glassmorphism themes, use the theme's actual background
      return {
        backgroundColor: themeConfig.background,
        // Ensure good contrast for text
        color: themeConfig.semanticColors?.textBody || 'inherit'
      };
    }
    return {};
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${getOverlayClasses()} backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Dialog */}
      <div className={`${getModalClasses()} relative w-full max-w-lg rounded-xl p-6 text-current`} style={getModalStyle()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">About RdLn™</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm">
          {/* Logo and Version */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={window.isElectron ? "./images/rdln-logo.png" : "/images/rdln-logo.png"} 
              alt="RdLn Logo" 
              className="w-12 h-12 rounded-lg shadow-sm"
            />
            <div>
              <div className="font-medium">RdLn™</div>
              <div className="text-xs opacity-70">Version 0.6.0 Beta</div>
            </div>
          </div>

          {/* Description */}
          <p className="leading-relaxed">
            Professional document comparison tool with advanced OCR capabilities. 
            Built for legal professionals and organizations requiring precise document analysis 
            with complete confidentiality through client-side processing.
          </p>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2">Copyright & License</h3>
            <div className="text-xs space-y-1 opacity-80">
              <p>© {currentYear} RdLn Team. All rights reserved.</p>
              <p>RdLn™ is a trademark of RdLn Team.</p>
              <p>
                <strong>Proprietary Software</strong> - All rights reserved.
              </p>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2">Legal Notice</h3>
            <div className="text-xs space-y-1 opacity-80">
              <p>
                This software is proprietary and confidential. Unauthorized copying, 
                distribution, modification, or use is strictly prohibited.
              </p>
              <p>
                This software is provided "AS IS" without warranty of any kind, 
                express or implied.
              </p>
            </div>
          </div>

          {/* License Information */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2">License Information</h3>
            <div className="text-xs opacity-80">
              <p>
                For licensing inquiries and commercial use permissions, 
                please contact RdLn Team.
              </p>
            </div>
          </div>

          {/* Beta Testing Terms */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2">Beta Testing Agreement</h3>
            <div className="text-xs opacity-80">
              <p className="mb-2">
                This is beta software provided for testing purposes. 
                Key terms include:
              </p>
              <ul className="space-y-1 ml-4 text-xs">
                <li>• Features are experimental and may change</li>
                <li>• Beta features are confidential</li>                
              </ul>
              <p className="mt-2">
                <strong>Contact:</strong> <a href="mailto:kai@rdln.io" className="text-blue-400 hover:text-blue-300 underline transition-colors">kai@rdln.io</a> for questions, suggestions and feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
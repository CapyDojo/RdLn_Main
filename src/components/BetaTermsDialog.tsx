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
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface BetaTermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaTermsDialog: React.FC<BetaTermsDialogProps> = ({ isOpen, onClose }) => {
  const { themeConfig } = useTheme();

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
      <div className={`${getModalClasses()} relative w-full max-w-2xl max-h-[80vh] rounded-xl p-6 text-current border-2 border-yellow-500/30`} style={getModalStyle()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Beta Testing Agreement</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-96 text-sm space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-yellow-600">
              ⚠️ This is BETA software - use with caution and backup your data!
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">1. BETA SOFTWARE ACKNOWLEDGMENT</h3>
            <p className="text-xs leading-relaxed opacity-90">
              You acknowledge that RdLn™ (version 0.5.0) is beta software that may contain bugs, 
              errors, or incomplete features. This software is provided for testing purposes only 
              and is not recommended for production use with critical documents.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">2. DATA RISKS & BACKUP RESPONSIBILITY</h3>
            <p className="text-xs leading-relaxed opacity-90">
              You accept full responsibility for backing up your documents. RdLn Team is not 
              liable for any data loss, corruption, or damage that may occur during beta testing. 
              <strong> Always maintain copies of important documents outside of this software.</strong>
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">3. CONFIDENTIALITY</h3>
            <p className="text-xs leading-relaxed opacity-90">
              Beta features and functionality are confidential. You agree not to publicly discuss, 
              review, or share screenshots of unreleased features without express written consent 
              from RdLn Team.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">4. FEEDBACK OWNERSHIP</h3>
            <p className="text-xs leading-relaxed opacity-90">
              Any feedback, suggestions, or bug reports you provide become the exclusive property 
              of RdLn Team and may be used to improve the software without compensation.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">5. NO WARRANTY & LIMITATION OF LIABILITY</h3>
            <p className="text-xs leading-relaxed opacity-90">
              This beta software is provided "AS IS" without any warranties. RdLn Team shall not 
              be liable for any damages arising from your use of this beta software, including but 
              not limited to data loss, business interruption, or lost profits.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">6. TERMINATION</h3>
            <p className="text-xs leading-relaxed opacity-90">
              RdLn Team may terminate your beta access at any time. Upon termination, you must 
              cease using the beta software and destroy any copies.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">7. GOVERNING LAW</h3>
            <p className="text-xs leading-relaxed opacity-90">
              This agreement is governed by the laws of Queensland, Australia.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-xs opacity-80">
              <strong>Contact:</strong> <a href="mailto:kai@rdln.io" className="text-blue-400 hover:text-blue-300 underline transition-colors">kai@rdln.io</a> for questions or concerns about these beta terms.
            </p>
            <p className="text-xs opacity-60 mt-1">
              Last updated: August 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
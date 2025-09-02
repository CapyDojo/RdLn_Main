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

import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface BetaAgreementDialogProps {
  onAccept: () => void;
}

export const BetaAgreementDialog: React.FC<BetaAgreementDialogProps> = ({ onAccept }) => {
  const [showFullTerms, setShowFullTerms] = useState(false);
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
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleAccept = () => {
    // Store acceptance in localStorage with timestamp
    const acceptanceData = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '0.6.0'
    };
    localStorage.setItem('rdln_beta_terms_accepted', JSON.stringify(acceptanceData));
    onAccept();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${getOverlayClasses()} backdrop-blur-sm`}>
      {/* Main Agreement Modal */}
      {!showFullTerms ? (
        <div className={`${getModalClasses()} relative w-full max-w-2xl rounded-xl p-8 text-current border-2 border-yellow-500/30`} style={getModalStyle()}>
          {/* Warning Header */}
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl font-semibold text-yellow-500">Beta Testing Agreement</h2>
          </div>

          {/* Key Warnings */}
          <div className="space-y-3 mb-6">
            <div className="leading-relaxed">
              <p className="font-medium mb-2 text-xl">This is <strong>BETA SOFTWARE</strong>. By proceeding, you acknowledge:</p>
              <ul className="space-y-1 text-xl opacity-90 ml-4">
                <li>• <strong>Features may change</strong> - Beta features are experimental</li>
                <li>• <strong>Limited support</strong> - This is test software</li>
                <li>• <strong>No warranties</strong> - Use at your own risk</li>          
              </ul>
            </div>

            <div className="opacity-80 mt-3">
              <p className="text-xl">By accepting, you agree to:</p>
              <ul className="space-y-1 text-xl ml-4 mt-1">
                <li>• Keep beta features confidential</li>
                <li>• Provide feedback to improve the software</li>
                <li>• Accept that RdLn™ owns any feedback provided</li>
                <li>• Allow anonymous usage analytics for improvement</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFullTerms(true)}
              className="flex items-center gap-1 px-5 py-4 text-xl border border-current/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FileText size={14} />
              View Full Terms
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-8 py-4 text-xl rounded-lg transition-colors"
            >
              I Accept Beta Terms
            </button>
          </div>

          {/* Contact */}
          <p className="text-xl opacity-60 mt-6 text-center">
            Questions, Suggestions and Feedback welcome!<br /><br />
            <span className="text-2xl">Contact: <a href="mailto:kai@rdln.io" className="text-yellow-500 hover:text-yellow-400 underline transition-colors">kai@rdln.io</a></span><br />
          </p>
        </div>
      ) : (
        /* Full Terms Modal */
        <div className={`${getModalClasses()} relative w-full max-w-2xl max-h-[80vh] rounded-xl p-6 text-current overflow-hidden`} style={getModalStyle()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-semibold">RdLn™ Beta Testing Agreement</h2>
            <button
              onClick={() => setShowFullTerms(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Full Terms Content */}
          <div className="overflow-y-auto max-h-96 text-xl space-y-4 mb-6">
            <div>
              <h3 className="font-medium mb-2 text-xl">1. BETA SOFTWARE ACKNOWLEDGMENT</h3>
              <p className="text-lg leading-relaxed opacity-90">
                You acknowledge that RdLn™ (version 0.6.0) is beta software that may contain bugs, 
                errors, or incomplete features. This software is provided for testing purposes only 
                and is not recommended for production use with critical documents.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">2. DATA RISKS & BACKUP RESPONSIBILITY</h3>
              <p className="text-lg leading-relaxed opacity-90">
                You accept full responsibility for backing up your documents. RdLn Team is not 
                liable for any data loss, corruption, or damage that may occur during beta testing. 
                Always maintain copies of important documents outside of this software.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">3. CONFIDENTIALITY</h3>
              <p className="text-lg leading-relaxed opacity-90">
                Beta features and functionality are confidential. You agree not to publicly discuss, 
                review, or share screenshots of unreleased features without express written consent 
                from RdLn Team.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">4. ANALYTICS & DATA COLLECTION</h3>
              <p className="text-lg leading-relaxed opacity-90">
                To improve the software, we collect usage data including:
              </p>
              <ul className="text-lg leading-relaxed opacity-90 ml-4 mt-1 space-y-1">
                <li>• Feature usage (e.g., quick compare, scroll lock)</li>
                <li>• Document operations (uploads, comparisons, OCR processing)</li>
                <li>• Performance metrics (processing times, errors)</li>
                <li>• UI interactions (theme changes, navigation)</li>
              </ul>
              <p className="text-lg leading-relaxed opacity-90 mt-2">
                We do <strong>NOT</strong> collect document content, personal information, or file names. 
                Data is collected through PostHog analytics with privacy-focused settings enabled:
              </p>
              <ul className="text-lg leading-relaxed opacity-90 ml-4 mt-1 space-y-1">
                <li>• Text masking enabled (hides sensitive content)</li>
                <li>• Element attribute masking enabled</li>
                <li>• Session recordings mask all inputs and text</li>
                <li>• No autocapture of sensitive elements</li>
              </ul>
              <p className="text-lg leading-relaxed opacity-90 mt-2">
                Data is used solely to improve the software experience and is retained according to PostHog's data retention policies.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">5. FEEDBACK OWNERSHIP</h3>
              <p className="text-lg leading-relaxed opacity-90">
                Any feedback, suggestions, or bug reports you provide become the exclusive property 
                of RdLn Team and may be used to improve the software without compensation.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">6. NO WARRANTY & LIMITATION OF LIABILITY</h3>
              <p className="text-lg leading-relaxed opacity-90">
                This beta software is provided "AS IS" without any warranties. RdLn Team shall not 
                be liable for any damages arising from your use of this beta software, including but 
                not limited to data loss, business interruption, or lost profits.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">7. TERMINATION</h3>
              <p className="text-lg leading-relaxed opacity-90">
                RdLn Team may terminate your beta access at any time. Upon termination, you must 
                cease using the beta software and destroy any copies.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-xl">8. GOVERNING LAW</h3>
              <p className="text-lg leading-relaxed opacity-90">
                This agreement is governed by the laws of Queensland, Australia.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFullTerms(false)}
              className="px-4 py-2 border border-current/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              I Accept These Beta Terms
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
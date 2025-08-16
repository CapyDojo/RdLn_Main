/**
 * Auto Scroll Hook - Production Feature
 * 
 * Handles automatic scrolling to results when comparison is completed.
 * Extracted from experimental system to become a standard production feature.
 */

import { useEffect } from 'react';
import { FEATURE_FLAGS } from '../config/appConfig';
import { DEV_CONFIG } from '../config/appConfig';

interface UseAutoScrollOptions {
  result: any;
  isProcessing: boolean;
}

export const useAutoScroll = ({ result, isProcessing }: UseAutoScrollOptions) => {
  // Auto-scroll to output panel when results are completed
  useEffect(() => {
    if (!FEATURE_FLAGS.AUTO_SCROLL_ENABLED) return;
    
    // Scroll when results are completed (better timing for when output actually exists)
    if (result && !isProcessing) {
      // Wait for DOM to update, then scroll to output section
      setTimeout(() => {
        // Try to find the output section first, then fallback to data-output-panel
        const outputSection = document.querySelector('.output-section');
        const outputPanel = document.querySelector('[data-output-panel]');
        const targetElement = outputSection || outputPanel;

        if (targetElement) {
          // Get the demo panel height first
          const demoPanel = document.querySelector('.glass-panel.bg-theme-primary-50\\/80');
          const demoPanelHeight = demoPanel ? demoPanel.getBoundingClientRect().height + 60 : 140; // 60px margin, 140px fallback
          
          // Calculate the target position manually
          const targetRect = targetElement.getBoundingClientRect();
          const targetTop = targetRect.top + window.scrollY;
          
          // Scroll to position the output section just below the demo panel
          const scrollToPosition = Math.max(0, targetTop - demoPanelHeight);
          
          window.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
          });
          
          if (DEV_CONFIG.DEBUGGING.COMPARISON_DEBUG) {
            console.log('🎯 Auto-scrolled to output section (results completed) - Production Feature');
          }
        }
      }, 200); // Slightly longer delay to ensure content is rendered
    }
  }, [result, isProcessing]);

  return {
    isEnabled: FEATURE_FLAGS.AUTO_SCROLL_ENABLED
  };
};
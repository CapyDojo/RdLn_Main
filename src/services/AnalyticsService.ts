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

import posthog from 'posthog-js';

export interface AnalyticsConfig {
  apiKey: string;
  apiHost?: string;
  enableInDevelopment?: boolean;
  capturePageviews?: boolean;
  captureClicks?: boolean;
}

class AnalyticsService {
  private initialized = false;
  private config: AnalyticsConfig | null = null;

  /**
   * Initialize PostHog analytics
   */
  initialize(config: AnalyticsConfig): void {
    this.config = config;
    
    // Don't initialize in development unless explicitly enabled
    const isDevelopment = typeof process !== 'undefined' 
      ? process.env.NODE_ENV === 'development' 
      : window.location.hostname === 'localhost';
    
    if (isDevelopment && !config.enableInDevelopment) {
      console.log('📊 Analytics: Disabled in development mode');
      return;
    }

    try {
      posthog.init(config.apiKey, {
        api_host: config.apiHost || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // Only create profiles for identified users
        capture_pageview: config.capturePageviews ?? true,
        capture_pageleave: true, // Track when users leave pages
        loaded: () => {
          console.log('📊 Analytics: PostHog initialized successfully');
          this.initialized = true;
        },
        // Privacy-focused settings for professional tool
        mask_all_element_attributes: true,
        mask_all_text: true,
        opt_out_capturing_by_default: false,
        autocapture: config.captureClicks ?? false, // Be selective about autocapture
        session_recording: {
          maskAllInputs: true,
          maskInputOptions: {
            password: true,
            email: true,
            'data-sensitive': true
          }
        }
      });
    } catch (error) {
      console.error('📊 Analytics: Failed to initialize PostHog:', error);
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      console.log(`📊 Analytics: Event not tracked (not initialized): ${eventName}`);
      return;
    }

    try {
      posthog.capture(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
        app_version: '0.5.15'
      });
    } catch (error) {
      console.error('📊 Analytics: Failed to track event:', eventName, error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path?: string): void {
    if (!this.initialized) return;

    try {
      posthog.capture('$pageview', {
        $current_url: path || window.location.href,
        app_version: '0.5.15'
      });
    } catch (error) {
      console.error('📊 Analytics: Failed to track page view:', error);
    }
  }

  /**
   * Identify user (call when user provides consent or identification)
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('📊 Analytics: Failed to identify user:', error);
    }
  }

  /**
   * Track user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      posthog.people.set(properties);
    } catch (error) {
      console.error('📊 Analytics: Failed to set user properties:', error);
    }
  }

  /**
   * Reset analytics (useful for privacy compliance)
   */
  reset(): void {
    if (!this.initialized) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error('📊 Analytics: Failed to reset:', error);
    }
  }

  /**
   * Opt user out of tracking
   */
  optOut(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_out_capturing();
      console.log('📊 Analytics: User opted out of tracking');
    } catch (error) {
      console.error('📊 Analytics: Failed to opt out:', error);
    }
  }

  /**
   * Opt user back into tracking
   */
  optIn(): void {
    if (!this.initialized) return;

    try {
      posthog.opt_in_capturing();
      console.log('📊 Analytics: User opted into tracking');
    } catch (error) {
      console.error('📊 Analytics: Failed to opt in:', error);
    }
  }

  /**
   * Feature flag functionality
   */
  isFeatureEnabled(flag: string): boolean {
    if (!this.initialized) return false;

    try {
      return posthog.isFeatureEnabled(flag) ?? false;
    } catch (error) {
      console.error('📊 Analytics: Failed to check feature flag:', flag, error);
      return false;
    }
  }

  /**
   * Check if analytics is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (!this.initialized) return;

    try {
      // Flush any pending events
      posthog.capture('app_shutdown');
      this.initialized = false;
      console.log('📊 Analytics: Shut down gracefully');
    } catch (error) {
      console.error('📊 Analytics: Error during shutdown:', error);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Convenience functions for common analytics events
export const trackEvent = {
  // Document operations
  documentUpload: (method: 'drag_drop' | 'file_picker' | 'paste', fileType?: string) => {
    analyticsService.track('document_uploaded', { method, file_type: fileType });
  },

  documentComparison: (documentType: 'text' | 'ocr', processingTime?: number) => {
    analyticsService.track('document_comparison', { 
      document_type: documentType, 
      processing_time_ms: processingTime 
    });
  },

  // OCR operations
  ocrStarted: (language: string, confidence?: number) => {
    analyticsService.track('ocr_started', { language, confidence });
  },

  ocrCompleted: (language: string, processingTime: number, wordCount?: number) => {
    analyticsService.track('ocr_completed', { 
      language, 
      processing_time_ms: processingTime, 
      word_count: wordCount 
    });
  },

  ocrFailed: (language: string, error: string) => {
    analyticsService.track('ocr_failed', { language, error });
  },

  // UI interactions
  themeChanged: (themeName: string) => {
    analyticsService.track('theme_changed', { theme_name: themeName });
  },

  featureUsed: (featureName: string, context?: Record<string, any>) => {
    analyticsService.track('feature_used', { feature_name: featureName, ...context });
  },

  // Performance metrics
  performanceMetric: (metricName: string, value: number, unit: string) => {
    analyticsService.track('performance_metric', { 
      metric_name: metricName, 
      value, 
      unit 
    });
  },

  // Errors
  errorOccurred: (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    analyticsService.track('error_occurred', { 
      error_type: errorType, 
      error_message: errorMessage, 
      ...context 
    });
  },

  // User journey
  tourStarted: () => {
    analyticsService.track('onboarding_tour_started');
  },

  tourCompleted: (duration: number) => {
    analyticsService.track('onboarding_tour_completed', { duration_ms: duration });
  },

  tourSkipped: (stepNumber: number) => {
    analyticsService.track('onboarding_tour_skipped', { step_number: stepNumber });
  }
};

export default analyticsService;
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

export interface AnalyticsConfig {
  apiKey: string;
  apiHost?: string;
  enableInDevelopment?: boolean;
  capturePageviews?: boolean;
  captureClicks?: boolean;
}

class AnalyticsServiceStub {
  initialize(): Promise<void> | void {
    return Promise.resolve();
  }

  track(_eventName: string, _properties?: Record<string, any>): void {
    // no-op
  }

  trackPageView(_path?: string): void {
    // no-op
  }

  identify(_userId: string, _properties?: Record<string, any>): void {
    // no-op
  }

  setUserProperties(_properties: Record<string, any>): void {
    // no-op
  }

  reset(): void {
    // no-op
  }

  optOut(): void {
    // no-op
  }

  optIn(): void {
    // no-op
  }

  isFeatureEnabled(_flag: string): boolean {
    return false;
  }

  isInitialized(): boolean {
    return false;
  }

  shutdown(): void {
    // no-op
  }
}

export const analyticsService = new AnalyticsServiceStub();

export const trackEvent = {
  documentUpload: (_method: 'drag_drop' | 'file_picker' | 'paste', _fileType?: string) => { },
  documentComparison: (_documentType: 'text' | 'ocr', _processingTime?: number) => { },
  ocrStarted: (_language: string, _confidence?: number) => { },
  ocrCompleted: (_language: string, _processingTime: number, _wordCount?: number) => { },
  ocrFailed: (_language: string, _error: string) => { },
  themeChanged: (_themeName: string) => { },
  featureUsed: (_featureName: string, _context?: Record<string, any>) => { },
  performanceMetric: (_metricName: string, _value: number, _unit: string) => { },
  errorOccurred: (_errorType: string, _errorMessage: string, _context?: Record<string, any>) => { },
  tourStarted: () => { },
  tourCompleted: (_duration: number) => { },
  tourSkipped: (_stepNumber: number) => { },
};

export default analyticsService;

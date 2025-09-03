/**
 * STEP 2: Background Loading Status Component (SSMR Implementation)
 * 
 * Safe, modular component to show background language loading progress.
 * This component can be easily removed without affecting core functionality.
 * 
 * Features:
 * - Optional display (can be hidden)
 * - Non-intrusive design
 * - Safe error handling
 * - Easy to disable/remove
 */

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { BackgroundLanguageLoader, LanguageLoadingStatus } from '../services/BackgroundLanguageLoader';
import { OCRLanguage } from '../types/ocr-types';
import { BaseComponentProps } from '../types/components';

interface BackgroundLoadingStatusProps extends BaseComponentProps {
  enabled?: boolean; // Easy disable switch
  compact?: boolean; // Compact vs full display
}

export const BackgroundLoadingStatus: React.FC<BackgroundLoadingStatusProps> = ({
  enabled = true, // ROLLBACK: Set to false to hide completely
  compact = true,
  className,
  style
}) => {
  const [loadingStatus, setLoadingStatus] = useState<Map<OCRLanguage, LanguageLoadingStatus>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to status updates
    const handleStatusUpdate = (status: Map<OCRLanguage, LanguageLoadingStatus>) => {
      setLoadingStatus(new Map(status));
      
      // Show component only if there's ongoing loading
      const hasActivity = Array.from(status.values()).some(s => 
        s.status === 'loading' || s.status === 'pending'
      );
      setIsVisible(hasActivity);
    };

    const unsubscribe = BackgroundLanguageLoader.onStatusUpdate(handleStatusUpdate);

    // Get initial status
    const initialStatus = BackgroundLanguageLoader.getLoadingStatus();
    handleStatusUpdate(initialStatus);

    // Auto-hide after all languages are loaded (with delay)
    const stats = BackgroundLanguageLoader.getStats();
    let hideTimeout: number | undefined;
    if (stats.pending === 0 && stats.loading === 0) {
      hideTimeout = window.setTimeout(() => setIsVisible(false), 5000); // Hide after 5 seconds
    }

    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      try { unsubscribe?.(); } catch {}
      try { BackgroundLanguageLoader.offStatusUpdate(handleStatusUpdate); } catch {}
    };
  }, [enabled]);

  // ROLLBACK: Easy disable
  if (!enabled || !isVisible) {
    return null;
  }

  const stats = BackgroundLanguageLoader.getStats();
  const statusArray = Array.from(loadingStatus.values());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return <Download className="w-3 h-3 animate-spin text-blue-500" />;
      case 'ready': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error': return <AlertCircle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  if (compact) {
    return (
      <div className={`glass-panel px-3 py-2 text-xs text-theme-neutral-600 border border-theme-neutral-200 rounded-lg ${className || ''}`} style={style}>
        <div className="flex items-center gap-2">
          <Download className="w-3 h-3 text-blue-500" />
          <span>Loading OCR languages: {stats.ready}/{stats.total}</span>
          {stats.loading > 0 && (
            <div className="animate-pulse">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-4 border border-theme-neutral-200 rounded-lg ${className || ''}`} style={style}>
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-medium text-theme-neutral-800">
          Background OCR Languages ({stats.ready}/{stats.total} ready)
        </h3>
      </div>
      
      <div className="space-y-1">
        {statusArray.map((status) => (
          <div key={status.language} className="flex items-center gap-2 text-xs">
            {getStatusIcon(status.status)}
            <span className="capitalize text-theme-neutral-600">
              {status.language}
            </span>
            <span className={`
              px-1.5 py-0.5 rounded text-xs font-medium
              ${status.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
              ${status.status === 'loading' ? 'bg-blue-100 text-blue-700' : ''}
              ${status.status === 'error' ? 'bg-red-100 text-red-700' : ''}
              ${status.status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
            `}>
              {status.status}
            </span>
          </div>
        ))}
      </div>
      
      {stats.totalLoadTime > 0 && (
        <div className="mt-2 pt-2 border-t border-theme-neutral-200 text-xs text-theme-neutral-500">
          Total load time: {Math.round(stats.totalLoadTime / 1000)}s
        </div>
      )}
    </div>
  );
};

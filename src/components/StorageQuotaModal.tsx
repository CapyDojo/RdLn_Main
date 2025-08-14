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

import React from 'react';
import { AlertTriangle, Download, Settings, Clock, Trash2, X } from 'lucide-react';

/**
 * Storage quota warning levels with associated colors and urgency
 */
export type QuotaWarningLevel = '75%' | '85%' | '95%';

/**
 * Export options for different scenarios
 */
export type ExportOption = 'full' | 'incremental' | 'dateRange' | 'selected';

/**
 * Props for the StorageQuotaModal component
 */
interface StorageQuotaModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Current storage usage percentage (0-100) */
  usagePercentage: number;
  /** Warning level based on usage percentage */
  warningLevel: QuotaWarningLevel;
  /** Total number of sessions */
  totalSessions: number;
  /** Number of sessions that would be cleaned up */
  sessionsToClean?: number;
  /** Number of new sessions since last export */
  newSessionsSinceExport?: number;
  /** Last export date */
  lastExportDate?: Date;
  /** Callback when user chooses to export sessions */
  onExport: (option: ExportOption) => void;
  /** Callback when user chooses to manage sessions manually */
  onManageSessions: () => void;
  /** Callback when user chooses auto-cleanup */
  onAutoClean: (olderThanDays: number) => void;
  /** Callback when user chooses export and cleanup */
  onExportAndClean: (exportOption: ExportOption, cleanupPercentage: number) => void;
  /** Callback when user dismisses the modal */
  onDismiss: (remindAt?: QuotaWarningLevel) => void;
  /** Callback when user closes the modal */
  onClose: () => void;
}

/**
 * StorageQuotaModal Component
 * 
 * Progressive storage quota warning system with glassmorphism design.
 * Shows contextual options based on storage usage level with appropriate
 * urgency indicators and theming.
 */
export const StorageQuotaModal: React.FC<StorageQuotaModalProps> = ({
  isOpen,
  usagePercentage,
  warningLevel,
  totalSessions,
  sessionsToClean = 0,
  newSessionsSinceExport = 0,
  lastExportDate,
  onExport,
  onManageSessions,
  onAutoClean,
  onExportAndClean,
  onDismiss,
  onClose,
}) => {
  if (!isOpen) return null;

  // Determine theme colors and urgency based on warning level
  const getThemeConfig = () => {
    switch (warningLevel) {
      case '75%':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          textColor: 'text-blue-700',
          primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondaryButton: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
          title: 'Storage Getting Full',
          urgency: 'gentle',
        };
      case '85%':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-800',
          textColor: 'text-orange-700',
          primaryButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          secondaryButton: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
          title: 'Storage Nearly Full',
          urgency: 'moderate',
        };
      case '95%':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          textColor: 'text-red-700',
          primaryButton: 'bg-red-600 hover:bg-red-700 text-white',
          secondaryButton: 'bg-red-100 hover:bg-red-200 text-red-800',
          title: 'Storage Critical',
          urgency: 'critical',
        };
    }
  };

  const theme = getThemeConfig();

  // Format last export date
  const formatLastExport = () => {
    if (!lastExportDate) return 'Never';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastExportDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return lastExportDate.toLocaleDateString();
  };

  // Render action buttons based on warning level
  const renderActionButtons = () => {
    switch (warningLevel) {
      case '75%':
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onExport('full')}
              className={`${theme.primaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Download size={18} />
              Export Sessions
            </button>
            <button
              onClick={onManageSessions}
              className={`${theme.secondaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Settings size={18} />
              Manage Sessions
            </button>
            <button
              onClick={() => onDismiss('85%')}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Remind Me Later
            </button>
          </div>
        );

      case '85%':
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onExportAndClean('full', 25)}
              className={`${theme.primaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Download size={18} />
              Export & Clean Up (Recommended)
            </button>
            <button
              onClick={onManageSessions}
              className={`${theme.secondaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Settings size={18} />
              <span>Manage Sessions</span>
              {theme.urgency === 'moderate' && (
                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                  URGENT
                </span>
              )}
            </button>
            <button
              onClick={() => onAutoClean(30)}
              className={`${theme.secondaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Clock size={18} />
              Auto-Clean Old Sessions (30+ days)
            </button>
            <button
              onClick={() => onDismiss('95%')}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Final Warning at 95%
            </button>
          </div>
        );

      case '95%':
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onExportAndClean('full', 50)}
              className={`${theme.primaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ring-2 ring-red-300 ring-offset-2`}
            >
              <Download size={18} />
              Export & Clean Up Now (Recommended)
            </button>
            <button
              onClick={onManageSessions}
              className={`${theme.secondaryButton} enhanced-button px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all`}
            >
              <Settings size={18} />
              <span>Open Memory Manager</span>
              <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                CRITICAL
              </span>
            </button>
            <button
              onClick={() => onExportAndClean('none', 50)}
              className="text-red-600 hover:text-red-800 px-4 py-3 rounded-lg font-medium transition-colors border border-red-300 hover:border-red-400"
            >
              <div className="flex items-center justify-center gap-2">
                <Trash2 size={18} />
                <span>Clean Without Export</span>
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                  RISKY
                </span>
              </div>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel max-w-md w-full mx-auto">
        <div className={`${theme.bgColor} ${theme.borderColor} border rounded-xl p-6 shadow-xl`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`${theme.iconColor} w-6 h-6`} />
              <h2 className={`${theme.titleColor} text-xl font-bold`}>
                {theme.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close storage quota warning"
            >
              <X size={20} />
            </button>
          </div>

          {/* Storage Usage Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className={`${theme.textColor} font-medium`}>Storage Usage</span>
              <span className={`${theme.titleColor} font-bold`}>{usagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  warningLevel === '75%' ? 'bg-blue-500' :
                  warningLevel === '85%' ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Session Info */}
          <div className={`${theme.textColor} mb-6 space-y-2 text-sm`}>
            <div className="flex justify-between">
              <span>Total Sessions:</span>
              <span className="font-semibold">{totalSessions}</span>
            </div>
            {newSessionsSinceExport > 0 && (
              <div className="flex justify-between">
                <span>New Since Export:</span>
                <span className="font-semibold">{newSessionsSinceExport}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Last Export:</span>
              <span className="font-semibold">{formatLastExport()}</span>
            </div>
            {sessionsToClean > 0 && (
              <div className="flex justify-between">
                <span>Sessions to Clean:</span>
                <span className="font-semibold">{sessionsToClean}</span>
              </div>
            )}
          </div>

          {/* Warning Message */}
          <div className={`${theme.textColor} mb-6 text-sm leading-relaxed`}>
            {warningLevel === '75%' && (
              <p>
                Your session storage is getting full. Consider exporting your sessions 
                as a backup or managing them to free up space.
              </p>
            )}
            {warningLevel === '85%' && (
              <p>
                Your session storage is nearly full. We recommend exporting and cleaning 
                up old sessions to prevent data loss and maintain performance.
              </p>
            )}
            {warningLevel === '95%' && (
              <p className="font-semibold">
                <strong>Critical:</strong> Your session storage is almost full. 
                Immediate action is required to prevent data loss. New sessions 
                may fail to save.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};
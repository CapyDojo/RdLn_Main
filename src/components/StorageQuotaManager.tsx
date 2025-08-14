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
import { StorageQuotaModal, QuotaWarningLevel, ExportOption } from './StorageQuotaModal';
import { useRdLnMemoryContext } from '../contexts/RdLnMemoryContext';
import { downloadTextFile, generateExportFilename } from '../utils/downloadUtils';

/**
 * StorageQuotaManager Component
 * 
 * Manages the display and interaction of storage quota warnings.
 * Monitors storage usage and shows appropriate warnings with contextual actions.
 */
export const StorageQuotaManager: React.FC = () => {
  const {
    storageQuotaInfo,
    exportSessions,
    autoCleanOldSessions,
    exportAndClean,
    dismissQuotaWarning,
  } = useRdLnMemoryContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show modal when storage quota warning should be displayed
  useEffect(() => {
    if (storageQuotaInfo.shouldShowWarning && storageQuotaInfo.warningLevel) {
      setIsModalOpen(true);
    }
  }, [storageQuotaInfo.shouldShowWarning, storageQuotaInfo.warningLevel]);

  // Handle export action
  const handleExport = (option: ExportOption) => {
    try {
      const exportData = exportSessions(option);
      const filename = generateExportFilename(option);
      
      // Trigger download
      downloadTextFile(exportData, filename, 'application/json');
      
      // Close modal after successful export
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to export sessions:', error);
      alert('Failed to export sessions. Please try again.');
    }
  };

  // Handle manage sessions action (opens RdLn Memory side panel)
  const handleManageSessions = () => {
    // This would typically trigger opening the RdLn Memory side panel
    // For now, we'll close the modal and let the user manually open it
    setIsModalOpen(false);
    
    // You could dispatch an event or call a callback to open the side panel
    // For example: onOpenMemoryPanel?.();
    console.log('🔧 Opening RdLn Memory management panel...');
  };

  // Handle auto-clean action
  const handleAutoClean = (olderThanDays: number) => {
    try {
      const cleanedCount = autoCleanOldSessions(olderThanDays);
      console.log(`🧹 Auto-cleaned ${cleanedCount} sessions older than ${olderThanDays} days`);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to auto-clean sessions:', error);
      alert('Failed to clean old sessions. Please try again.');
    }
  };

  // Handle export and clean action
  const handleExportAndClean = (exportOption: ExportOption, cleanupPercentage: number) => {
    try {
      const exportType = exportOption === 'full' ? 'full' : 
                        exportOption === 'incremental' ? 'incremental' : 'none';
      
      const result = exportAndClean(exportType, cleanupPercentage);
      
      // Download export file if export was performed
      if (result.exportData) {
        const filename = generateExportFilename('full', true); // Include time for backup files
        downloadTextFile(result.exportData, filename, 'application/json');
      }
      
      console.log(`🧹 Cleaned up ${result.cleanedCount} sessions (${cleanupPercentage}%)`);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to export and clean sessions:', error);
      alert('Failed to export and clean sessions. Please try again.');
    }
  };

  // Handle dismiss action
  const handleDismiss = (remindAt?: QuotaWarningLevel) => {
    dismissQuotaWarning(remindAt);
    setIsModalOpen(false);
  };

  // Handle close action
  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Calculate sessions to clean for display
  const getSessionsToClean = (): number => {
    if (!storageQuotaInfo.warningLevel) return 0;
    
    switch (storageQuotaInfo.warningLevel) {
      case '85%':
        return Math.floor(storageQuotaInfo.totalSessions * 0.25); // 25%
      case '95%':
        return Math.floor(storageQuotaInfo.totalSessions * 0.50); // 50%
      default:
        return 0;
    }
  };

  if (!storageQuotaInfo.warningLevel) {
    return null;
  }

  return (
    <StorageQuotaModal
      isOpen={isModalOpen}
      usagePercentage={storageQuotaInfo.usagePercentage}
      warningLevel={storageQuotaInfo.warningLevel}
      totalSessions={storageQuotaInfo.totalSessions}
      sessionsToClean={getSessionsToClean()}
      newSessionsSinceExport={storageQuotaInfo.newSessionsSinceExport}
      lastExportDate={storageQuotaInfo.lastExportDate}
      onExport={handleExport}
      onManageSessions={handleManageSessions}
      onAutoClean={handleAutoClean}
      onExportAndClean={handleExportAndClean}
      onDismiss={handleDismiss}
      onClose={handleClose}
    />
  );
};
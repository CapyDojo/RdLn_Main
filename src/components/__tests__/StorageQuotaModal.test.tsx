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
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StorageQuotaModal } from '../StorageQuotaModal';

describe('StorageQuotaModal', () => {
  const defaultProps = {
    isOpen: true,
    usagePercentage: 80,
    warningLevel: '75%' as const,
    totalSessions: 50,
    onExport: vi.fn(),
    onManageSessions: vi.fn(),
    onAutoClean: vi.fn(),
    onExportAndClean: vi.fn(),
    onDismiss: vi.fn(),
    onClose: vi.fn(),
  };

  it('should render when open', () => {
    render(<StorageQuotaModal {...defaultProps} />);
    
    expect(screen.getByText('Storage Getting Full')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<StorageQuotaModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Storage Getting Full')).not.toBeInTheDocument();
  });

  it('should show appropriate warning level styling for 75%', () => {
    render(<StorageQuotaModal {...defaultProps} warningLevel="75%" />);
    
    expect(screen.getByText('Storage Getting Full')).toBeInTheDocument();
    expect(screen.getByText('Export Sessions')).toBeInTheDocument();
    expect(screen.getByText('Remind Me Later')).toBeInTheDocument();
  });

  it('should show appropriate warning level styling for 85%', () => {
    render(<StorageQuotaModal {...defaultProps} warningLevel="85%" usagePercentage={87} />);
    
    expect(screen.getByText('Storage Nearly Full')).toBeInTheDocument();
    expect(screen.getByText('Export & Clean Up (Recommended)')).toBeInTheDocument();
    expect(screen.getByText('Auto-Clean Old Sessions (30+ days)')).toBeInTheDocument();
  });

  it('should show appropriate warning level styling for 95%', () => {
    render(<StorageQuotaModal {...defaultProps} warningLevel="95%" usagePercentage={97} />);
    
    expect(screen.getByText('Storage Critical')).toBeInTheDocument();
    expect(screen.getByText('Export & Clean Up Now (Recommended)')).toBeInTheDocument();
    expect(screen.getByText('Clean Without Export')).toBeInTheDocument();
  });

  it('should call onExport when export button is clicked', () => {
    const onExport = vi.fn();
    render(<StorageQuotaModal {...defaultProps} onExport={onExport} />);
    
    fireEvent.click(screen.getByText('Export Sessions'));
    expect(onExport).toHaveBeenCalledWith('full');
  });

  it('should call onManageSessions when manage button is clicked', () => {
    const onManageSessions = vi.fn();
    render(<StorageQuotaModal {...defaultProps} onManageSessions={onManageSessions} />);
    
    fireEvent.click(screen.getByText('Manage Sessions'));
    expect(onManageSessions).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<StorageQuotaModal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close storage quota warning/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should display session information correctly', () => {
    render(<StorageQuotaModal 
      {...defaultProps} 
      totalSessions={25}
      newSessionsSinceExport={5}
      lastExportDate={new Date('2025-01-01')}
    />);
    
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show progress bar with correct percentage', () => {
    render(<StorageQuotaModal {...defaultProps} usagePercentage={75} />);
    
    const progressBar = document.querySelector('[style*="width: 75%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
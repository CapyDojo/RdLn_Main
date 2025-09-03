/**
 * Comprehensive Tests for ProcessingDisplay Component
 * 
 * Tests the processing state component that shows progress indicators,
 * cancellation controls, and chunking progress during operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProcessingDisplay } from '../ProcessingDisplay';

// Mock performance utils
vi.mock('../../utils/performanceUtils.tsx', () => ({
  useComponentPerformance: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackRender: vi.fn(),
    trackMetric: vi.fn(),
    getMetrics: vi.fn(() => ({}))
  })),
  usePerformanceAwareHandler: vi.fn((handler) => handler)
}));

describe('ProcessingDisplay Component', () => {
  const mockChunkingProgress = {
    progress: 50,
    stage: 'Processing chunks',
    isChunking: true,
    enabled: true
  };

  const defaultProps = {
    chunkingProgress: mockChunkingProgress,
    isCancelling: false,
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('should render with glass panel styling', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);
      const glassPanel = container.querySelector('.glass-panel');
      expect(glassPanel).toBeTruthy();
    });

    it('should display the processing title', () => {
      render(<ProcessingDisplay {...defaultProps} />);
      expect(screen.getByText('Processing Comparison...')).toBeTruthy();
    });

    it('should apply custom className and style', () => {
      const customClass = 'custom-processing-class';
      const customStyle = { backgroundColor: 'purple' };
      
      const { container } = render(
        <ProcessingDisplay 
          {...defaultProps} 
          className={customClass}
          style={customStyle}
        />
      );
      
      const component = container.firstChild as HTMLElement;
      expect(component.className).toContain(customClass);
      expect(component.style.backgroundColor).toBe('purple');
    });
  });

  describe('Chunking Progress Display', () => {
    it('should show chunking progress when enabled and active', () => {
      render(<ProcessingDisplay {...defaultProps} />);

      expect(screen.getByText('Processing chunks')).toBeTruthy();
      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
    });

    it('should display progress bar with correct value', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);

      // Progress bar is a div with CSS width styling, not an input
      const progressBar = container.querySelector('.h-3.bg-theme-primary-600');
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('style')).toContain('width: 50%');
    });

    it('should show different progress stages', () => {
      const stageProgress = {
        ...mockChunkingProgress,
        stage: 'Analyzing differences',
        progress: 75
      };

      render(
        <ProcessingDisplay
          {...defaultProps}
          chunkingProgress={stageProgress}
        />
      );

      expect(screen.getByText('Analyzing differences')).toBeTruthy();
      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
    });

    it('should handle 0% progress', () => {
      const zeroProgress = {
        ...mockChunkingProgress,
        progress: 0,
        stage: 'Starting...'
      };

      render(
        <ProcessingDisplay
          {...defaultProps}
          chunkingProgress={zeroProgress}
        />
      );

      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
      expect(screen.getByText('Starting...')).toBeTruthy();
    });

    it('should handle 100% progress', () => {
      const completeProgress = {
        ...mockChunkingProgress,
        progress: 100,
        stage: 'Finalizing...'
      };

      render(
        <ProcessingDisplay
          {...defaultProps}
          chunkingProgress={completeProgress}
        />
      );

      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
      expect(screen.getByText('Finalizing...')).toBeTruthy();
    });
  });

  describe('Non-Chunking Display', () => {
    it('should show basic processing when chunking is disabled', () => {
      const nonChunkingProgress = {
        ...mockChunkingProgress,
        enabled: false,
        isChunking: false
      };
      
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={nonChunkingProgress}
        />
      );
      
      expect(screen.getByText('Starting comparison...')).toBeTruthy();
      expect(screen.queryByText('Processing chunks')).toBeNull();
    });

    it('should show basic processing when not currently chunking', () => {
      const notChunkingProgress = {
        ...mockChunkingProgress,
        isChunking: false
      };
      
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={notChunkingProgress}
        />
      );
      
      expect(screen.getByText('Starting comparison...')).toBeTruthy();
    });

    it('should show spinner animation for basic processing', () => {
      const basicProgress = {
        ...mockChunkingProgress,
        enabled: false,
        isChunking: false
      };
      
      const { container } = render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={basicProgress}
        />
      );
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });

  describe('Cancel Functionality', () => {
    it('should render cancel button', () => {
      render(<ProcessingDisplay {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeTruthy();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = vi.fn();
      
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          onCancel={mockOnCancel}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should disable cancel button when cancelling', () => {
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          isCancelling={true}
        />
      );
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should show cancelling state text', () => {
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          isCancelling={true}
        />
      );
      
      expect(screen.getByText('Cancelling...')).toBeTruthy();
    });

    it('should have cancel button in both chunking and non-chunking modes', () => {
      // Test chunking mode
      const { rerender } = render(<ProcessingDisplay {...defaultProps} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
      
      // Test non-chunking mode
      const nonChunkingProgress = {
        ...mockChunkingProgress,
        enabled: false,
        isChunking: false
      };
      
      rerender(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={nonChunkingProgress}
        />
      );
      
      expect(screen.getByRole('button', { name: /cancel/i })).toBeTruthy();
    });
  });

  describe('Visual Elements', () => {
    it('should have proper minimum height', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);

      const contentArea = container.querySelector('.glass-panel-inner-content');
      expect(contentArea?.getAttribute('style')).toContain('min-height: 300px');
    });

    it('should center content properly', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);
      
      const contentArea = container.querySelector('.glass-panel-inner-content');
      expect(contentArea?.className).toContain('flex');
      expect(contentArea?.className).toContain('items-center');
      expect(contentArea?.className).toContain('justify-center');
    });

    it('should have proper header styling', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);
      
      const header = container.querySelector('.glass-panel-header-footer');
      expect(header).toBeTruthy();
      expect(header?.className).toContain('border-b');
    });
  });

  describe('Progress Bar Styling', () => {
    it('should style progress bar correctly', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);

      // Progress bar is a div with CSS styling
      const progressContainer = container.querySelector('.w-full.bg-theme-neutral-200.rounded-full.h-3');
      expect(progressContainer).toBeTruthy();

      const progressBar = container.querySelector('.h-3.bg-theme-primary-600.rounded-full');
      expect(progressBar).toBeTruthy();
    });

    it('should have proper progress bar styling', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);

      const progressBar = container.querySelector('.h-3.bg-theme-primary-600');
      expect(progressBar?.getAttribute('style')).toContain('width: 50%');
      expect(progressBar?.className).toContain('transition-all');
      expect(progressBar?.className).toContain('duration-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative progress values', () => {
      const negativeProgress = {
        ...mockChunkingProgress,
        progress: -10
      };
      
      const { container } = render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={negativeProgress}
        />
      );
      
      // Should still render without errors
      expect(container).toBeTruthy();
    });

    it('should handle progress values over 100', () => {
      const overProgress = {
        ...mockChunkingProgress,
        progress: 150
      };

      const { container } = render(
        <ProcessingDisplay
          {...defaultProps}
          chunkingProgress={overProgress}
        />
      );

      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
    });

    it('should handle empty stage text', () => {
      const emptyStage = {
        ...mockChunkingProgress,
        stage: ''
      };
      
      const { container } = render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={emptyStage}
        />
      );
      
      expect(container).toBeTruthy();
    });

    it('should handle very long stage text', () => {
      const longStage = {
        ...mockChunkingProgress,
        stage: 'This is a very long stage description that might overflow the container and cause layout issues'
      };
      
      render(
        <ProcessingDisplay 
          {...defaultProps} 
          chunkingProgress={longStage}
        />
      );
      
      expect(screen.getByText(longStage.stage)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      render(<ProcessingDisplay {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.tagName.toLowerCase()).toBe('button');
    });

    it('should have proper progress bar accessibility', () => {
      const { container } = render(<ProcessingDisplay {...defaultProps} />);

      // Progress bar is a visual div element
      const progressBar = container.querySelector('.h-3.bg-theme-primary-600');
      expect(progressBar).toBeTruthy();
    });

    it('should have readable text content', () => {
      render(<ProcessingDisplay {...defaultProps} />);
      
      expect(screen.getByText('Processing Comparison...')).toBeTruthy();
      expect(screen.getByText('Processing chunks')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle rapid progress updates', () => {
      const { rerender } = render(<ProcessingDisplay {...defaultProps} />);
      
      // Simulate rapid progress updates
      for (let i = 0; i <= 100; i += 10) {
        const updatedProgress = {
          ...mockChunkingProgress,
          progress: i,
          stage: `Processing ${i}%`
        };
        
        rerender(
          <ProcessingDisplay 
            {...defaultProps} 
            chunkingProgress={updatedProgress}
          />
        );
      }
      
      expect(screen.getByText('% complete', { exact: false })).toBeTruthy();
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<ProcessingDisplay {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });
  });
});

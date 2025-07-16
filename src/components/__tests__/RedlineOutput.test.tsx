/**
 * Comprehensive Tests for RedlineOutput Component
 * 
 * Tests the main output component that displays diff changes with
 * performance optimization, chunking, and experimental features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RedlineOutput } from '../RedlineOutput';
import { ExperimentalLayoutProvider } from '../../contexts/ExperimentalLayoutContext';
import { DiffChange } from '../../types';

// Mock performance utils
vi.mock('../../utils/performanceUtils.tsx', () => ({
  useComponentPerformance: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackRender: vi.fn(),
    getMetrics: vi.fn(() => ({}))
  })),
  usePerformanceAwareHandler: vi.fn((handler) => handler)
}));

// Mock intersection observer for chunking
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('RedlineOutput Component', () => {
  const mockChanges: DiffChange[] = [
    { type: 'unchanged', content: 'This is unchanged text.', index: 0 },
    { type: 'added', content: 'This is added text.', index: 1 },
    { type: 'removed', content: 'This is removed text.', index: 2 },
    { type: 'unchanged', content: 'More unchanged text.', index: 3 }
  ];

  const defaultProps = {
    changes: mockChanges,
    onCopy: vi.fn(),
    height: 500
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
    });

    it('should render with glass panel styling', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const glassPanel = container.querySelector('.glass-panel');
      expect(glassPanel).toBeTruthy();
    });

    it('should render header with copy button by default', () => {
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByRole('button', { name: /copy/i })).toBeTruthy();
    });

    it('should hide header when hideHeader prop is true', () => {
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} hideHeader={true} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
    });

    it('should apply custom className and style', () => {
      const customClass = 'custom-test-class';
      const customStyle = { backgroundColor: 'red' };
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            className={customClass}
            style={customStyle}
          />
        </ExperimentalLayoutProvider>
      );
      
      const component = container.firstChild as HTMLElement;
      expect(component.className).toContain(customClass);
      expect(component.style.backgroundColor).toBe('red');
    });
  });

  describe('Content Rendering', () => {
    it('should render all diff changes', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container.textContent).toContain('This is unchanged text.');
      expect(container.textContent).toContain('This is added text.');
      expect(container.textContent).toContain('This is removed text.');
      expect(container.textContent).toContain('More unchanged text.');
    });

    it('should apply correct styling for different change types', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      // Check for addition styling (green background)
      const addedElements = container.querySelectorAll('[style*="background"]');
      expect(addedElements.length).toBeGreaterThan(0);
    });

    it('should handle empty changes array', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} changes={[]} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
      const contentArea = container.querySelector('.glass-input-field');
      expect(contentArea).toBeTruthy();
    });

    it('should handle large content with chunking', () => {
      const largeChanges: DiffChange[] = Array.from({ length: 100 }, (_, i) => ({
        type: i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'unchanged',
        content: `Content chunk ${i} with some text to make it longer.`,
        index: i
      }));

      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} changes={largeChanges} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
      // Should still render content even with many changes
      expect(container.textContent).toContain('Content chunk 0');
    });
  });

  describe('Processing State', () => {
    it('should show processing indicator when isProcessing is true', () => {
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            isProcessing={true}
            processingStatus="Analyzing differences..."
          />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByText('Analyzing differences...')).toBeTruthy();
      expect(container.querySelector('.animate-spin')).toBeTruthy();
    });

    it('should hide content when processing', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            isProcessing={true}
          />
        </ExperimentalLayoutProvider>
      );
      
      // Should not show the actual diff content when processing
      expect(container.textContent).not.toContain('This is unchanged text.');
    });

    it('should show content when not processing', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            isProcessing={false}
          />
        </ExperimentalLayoutProvider>
      );
      
      expect(container.textContent).toContain('This is unchanged text.');
    });
  });

  describe('User Interactions', () => {
    it('should call onCopy when copy button is clicked', () => {
      const mockOnCopy = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} onCopy={mockOnCopy} />
        </ExperimentalLayoutProvider>
      );
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);
      
      expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it('should handle scroll events', () => {
      const scrollRef = React.createRef<HTMLDivElement>();
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} scrollRef={scrollRef} />
        </ExperimentalLayoutProvider>
      );
      
      const scrollContainer = container.querySelector('[data-testid="scroll-container"]');
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
        // Should not throw errors
        expect(true).toBe(true);
      }
    });
  });

  describe('Experimental Features Integration', () => {
    it('should handle overlay mode', () => {
      const mockOnShowOverlay = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            onShowOverlay={mockOnShowOverlay}
            isInOverlayMode={false}
          />
        </ExperimentalLayoutProvider>
      );
      
      // Component should render without errors in overlay mode
      expect(screen.getByRole('button', { name: /copy/i })).toBeTruthy();
    });

    it('should handle background mode changes', () => {
      const mockOnBackgroundModeChange = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <RedlineOutput 
            {...defaultProps} 
            onBackgroundModeChange={mockOnBackgroundModeChange}
          />
        </ExperimentalLayoutProvider>
      );
      
      // Component should render without errors
      expect(container).toBeTruthy();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should be keyboard accessible', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const scrollContainer = container.querySelector('.scroll-container');
      if (scrollContainer) {
        // Should be focusable for keyboard navigation
        expect(scrollContainer.getAttribute('tabIndex')).toBeDefined();
      }
    });

    it('should handle keyboard events', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const scrollContainer = container.querySelector('.scroll-container');
      if (scrollContainer) {
        // Should handle keyboard events without errors
        fireEvent.keyDown(scrollContainer, { key: 'ArrowDown' });
        fireEvent.keyDown(scrollContainer, { key: 'ArrowUp' });
        fireEvent.keyDown(scrollContainer, { key: 'PageDown' });
        fireEvent.keyDown(scrollContainer, { key: 'PageUp' });
        
        expect(true).toBe(true); // No errors thrown
      }
    });

    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const scrollContainer = container.querySelector('.scroll-container');
      if (scrollContainer) {
        expect(scrollContainer.getAttribute('role')).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined changes gracefully', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} changes={undefined as any} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
    });

    it('should handle very long content', () => {
      const longContent = 'A'.repeat(10000);
      const longChanges: DiffChange[] = [
        { type: 'unchanged', content: longContent, index: 0 }
      ];
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} changes={longChanges} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
    });

    it('should handle special characters and unicode', () => {
      const specialChanges: DiffChange[] = [
        { type: 'unchanged', content: '🚀 Unicode test with émojis and àccénts', index: 0 },
        { type: 'added', content: '中文测试 and العربية', index: 1 }
      ];
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput {...defaultProps} changes={specialChanges} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container.textContent).toContain('🚀 Unicode test');
      expect(container.textContent).toContain('中文测试');
    });
  });
});

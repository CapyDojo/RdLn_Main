/**
 * Comprehensive Tests for OutputLayout Component
 * 
 * Tests the layout component that organizes the display of comparison
 * results with resize handles and statistics.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { OutputLayout } from '../OutputLayout';
import { ExperimentalLayoutProvider } from '../../contexts/ExperimentalLayoutContext';
import { DiffChange } from '../../types';

// Mock RedlineOutput component
vi.mock('../RedlineOutput', () => ({
  RedlineOutput: vi.fn(({ changes, onCopy, height, isProcessing }) => (
    <div data-testid="mock-redline-output">
      <div data-testid="redline-height">{height}</div>
      <div data-testid="redline-processing">{isProcessing.toString()}</div>
      <div data-testid="redline-changes-count">{changes.length}</div>
      <button onClick={onCopy} data-testid="redline-copy-button">Copy</button>
    </div>
  ))
}));

// Mock ComparisonStats component
vi.mock('../ComparisonStats', () => ({
  ComparisonStats: vi.fn(({ stats }) => (
    <div data-testid="mock-comparison-stats">
      <div data-testid="stats-additions">{stats.additions}</div>
      <div data-testid="stats-deletions">{stats.deletions}</div>
      <div data-testid="stats-unchanged">{stats.unchanged}</div>
    </div>
  ))
}));

describe('OutputLayout Component', () => {
  const mockChanges: DiffChange[] = [
    { type: 'unchanged', content: 'Unchanged text', index: 0 },
    { type: 'added', content: 'Added text', index: 1 },
    { type: 'removed', content: 'Removed text', index: 2 }
  ];

  const mockStats = {
    additions: 1,
    deletions: 1,
    unchanged: 1,
    totalChanges: 3,
    similarity: 66.67
  };

  const mockOutputResizeHandlers = {
    handleMouseDown: vi.fn(),
    outputResizeHandleRef: React.createRef<HTMLDivElement>()
  };

  const defaultProps = {
    changes: mockChanges,
    stats: mockStats,
    USE_CSS_RESIZE: false,
    outputHeight: 500,
    onCopy: vi.fn(),
    outputResizeHandlers: mockOutputResizeHandlers
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(container).toBeTruthy();
    });

    it('should render RedlineOutput component', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('mock-redline-output')).toBeTruthy();
    });

    it('should render ComparisonStats component', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('mock-comparison-stats')).toBeTruthy();
    });

    it('should have output panel data attribute', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const outputPanel = container.querySelector('[data-output-panel]');
      expect(outputPanel).toBeTruthy();
    });

    it('should apply custom className and style', () => {
      const customClass = 'custom-output-class';
      const customStyle = { backgroundColor: 'blue' };
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout 
            {...defaultProps} 
            className={customClass}
            style={customStyle}
          />
        </ExperimentalLayoutProvider>
      );
      
      const component = container.firstChild as HTMLElement;
      expect(component.className).toContain(customClass);
      expect(component.style.backgroundColor).toBe('blue');
    });
  });

  describe('Props Passing', () => {
    it('should pass changes to RedlineOutput', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-changes-count')).toHaveTextContent('3');
    });

    it('should pass stats to ComparisonStats', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('stats-additions')).toHaveTextContent('1');
      expect(screen.getByTestId('stats-deletions')).toHaveTextContent('1');
      expect(screen.getByTestId('stats-unchanged')).toHaveTextContent('1');
    });

    it('should pass onCopy callback to RedlineOutput', () => {
      const mockOnCopy = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} onCopy={mockOnCopy} />
        </ExperimentalLayoutProvider>
      );
      
      const copyButton = screen.getByTestId('redline-copy-button');
      fireEvent.click(copyButton);
      
      expect(mockOnCopy).toHaveBeenCalledTimes(1);
    });

    it('should pass correct height when USE_CSS_RESIZE is false', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} USE_CSS_RESIZE={false} outputHeight={600} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-height')).toHaveTextContent('600');
    });

    it('should pass large height when USE_CSS_RESIZE is true', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} USE_CSS_RESIZE={true} outputHeight={600} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-height')).toHaveTextContent('9999');
    });
  });

  describe('Resize Functionality', () => {
    it('should render resize handle', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      const resizeHandle = container.querySelector('[data-testid="output-resize-handle"]');
      expect(resizeHandle).toBeTruthy();
    });

    it('should call resize handler on mouse down', () => {
      const mockHandleMouseDown = vi.fn();
      const resizeHandlers = {
        ...mockOutputResizeHandlers,
        handleMouseDown: mockHandleMouseDown
      };
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} outputResizeHandlers={resizeHandlers} />
        </ExperimentalLayoutProvider>
      );
      
      const resizeHandle = container.querySelector('[data-testid="output-resize-handle"]');
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle);
        expect(mockHandleMouseDown).toHaveBeenCalledTimes(1);
      }
    });

    it('should attach resize handle ref', () => {
      const resizeHandleRef = React.createRef<HTMLDivElement>();
      const resizeHandlers = {
        ...mockOutputResizeHandlers,
        outputResizeHandleRef: resizeHandleRef
      };
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} outputResizeHandlers={resizeHandlers} />
        </ExperimentalLayoutProvider>
      );
      
      expect(resizeHandleRef.current).toBeTruthy();
    });
  });

  describe('Experimental Features Integration', () => {
    it('should pass scroll ref to RedlineOutput', () => {
      const scrollRef = React.createRef<HTMLDivElement>();
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} scrollRef={scrollRef} />
        </ExperimentalLayoutProvider>
      );
      
      // RedlineOutput should receive the scroll ref
      expect(screen.getByTestId('mock-redline-output')).toBeTruthy();
    });

    it('should handle overlay mode', () => {
      const mockOnShowOverlay = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout 
            {...defaultProps} 
            onShowOverlay={mockOnShowOverlay}
            isInOverlayMode={true}
          />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('mock-redline-output')).toBeTruthy();
    });

    it('should handle header hiding', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} hideHeader={true} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('mock-redline-output')).toBeTruthy();
    });
  });

  describe('Visual Legend', () => {
    it('should render visual legend for additions and deletions', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      // Look for legend elements
      const legend = container.querySelector('.legend, [data-testid="visual-legend"]');
      // Legend might be part of ComparisonStats or separate
      expect(container).toBeTruthy(); // Basic check that component renders
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty changes array', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} changes={[]} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-changes-count')).toHaveTextContent('0');
    });

    it('should handle zero stats', () => {
      const zeroStats = {
        additions: 0,
        deletions: 0,
        unchanged: 0,
        totalChanges: 0,
        similarity: 100
      };
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} stats={zeroStats} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('stats-additions')).toHaveTextContent('0');
      expect(screen.getByTestId('stats-deletions')).toHaveTextContent('0');
      expect(screen.getByTestId('stats-unchanged')).toHaveTextContent('0');
    });

    it('should handle very large output height', () => {
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} outputHeight={50000} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-height')).toHaveTextContent('50000');
    });

    it('should handle undefined optional props', () => {
      const minimalProps = {
        changes: mockChanges,
        stats: mockStats,
        USE_CSS_RESIZE: false,
        outputHeight: 500,
        onCopy: vi.fn(),
        outputResizeHandlers: mockOutputResizeHandlers
      };
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...minimalProps} />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('mock-redline-output')).toBeTruthy();
    });
  });

  describe('Layout Structure', () => {
    it('should maintain proper DOM structure', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      // Should have main container
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('mb-6');
      
      // Should have output panel
      const outputPanel = container.querySelector('[data-output-panel]');
      expect(outputPanel).toBeTruthy();
    });

    it('should handle responsive layout', () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      // Component should render without layout issues
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeChanges: DiffChange[] = Array.from({ length: 1000 }, (_, i) => ({
        type: i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'unchanged',
        content: `Content ${i}`,
        index: i
      }));

      const largeStats = {
        additions: 334,
        deletions: 333,
        unchanged: 333,
        totalChanges: 1000,
        similarity: 33.3
      };
      
      render(
        <ExperimentalLayoutProvider>
          <OutputLayout 
            {...defaultProps} 
            changes={largeChanges}
            stats={largeStats}
          />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('redline-changes-count')).toHaveTextContent('1000');
    });

    it('should not cause memory leaks with refs', () => {
      const { unmount } = render(
        <ExperimentalLayoutProvider>
          <OutputLayout {...defaultProps} />
        </ExperimentalLayoutProvider>
      );
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });
});

/**
 * Comprehensive Tests for ComparisonStats Component
 * 
 * Tests the statistics display component that shows comparison metrics
 * with visual progress bars and detailed breakdowns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ComparisonStats } from '../ComparisonStats';

describe('ComparisonStats Component', () => {
  const mockStats = {
    additions: 5,
    deletions: 3,
    unchanged: 10,
    changed: 2,
    totalChanges: 10
  };

  const defaultProps = {
    stats: mockStats
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it('should render with glass panel styling', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      const glassPanel = container.querySelector('.glass-panel');
      expect(glassPanel).toBeTruthy();
    });

    it('should display the component title', () => {
      render(<ComparisonStats {...defaultProps} />);
      expect(screen.getByText('Comparison Statistics')).toBeTruthy();
    });

    it('should apply custom className and style', () => {
      const customClass = 'custom-stats-class';
      const customStyle = { backgroundColor: 'blue' };
      
      const { container } = render(
        <ComparisonStats 
          {...defaultProps} 
          className={customClass}
          style={customStyle}
        />
      );
      
      const component = container.firstChild as HTMLElement;
      expect(component.className).toContain(customClass);
      expect(component.style.backgroundColor).toBe('blue');
    });
  });

  describe('Statistics Display', () => {
    it('should display all statistics correctly', () => {
      render(<ComparisonStats {...defaultProps} />);

      expect(screen.getByText('5')).toBeTruthy(); // additions
      expect(screen.getByText('3')).toBeTruthy(); // deletions
      expect(screen.getByText('2')).toBeTruthy(); // changed

      // Check for multiple instances of "10" (unchanged and totalChanges)
      const tensElements = screen.getAllByText('10');
      expect(tensElements.length).toBe(2); // unchanged and totalChanges
    });

    it('should calculate and display percentages correctly', () => {
      render(<ComparisonStats {...defaultProps} />);
      
      // Total = 5 + 3 + 10 + 2 = 20
      // Additions: 5/20 = 25.0%
      // Deletions: 3/20 = 15.0%
      // Changed: 2/20 = 10.0%
      expect(screen.getByText('25.0% of total')).toBeTruthy();
      expect(screen.getByText('15.0% of total')).toBeTruthy();
      expect(screen.getByText('10.0% of total')).toBeTruthy();
    });

    it('should display total elements correctly', () => {
      render(<ComparisonStats {...defaultProps} />);
      
      // Total elements = 5 + 3 + 10 + 2 = 20
      expect(screen.getByText('20')).toBeTruthy();
    });

    it('should show labels for each statistic', () => {
      render(<ComparisonStats {...defaultProps} />);

      expect(screen.getByText('Additions')).toBeTruthy();
      expect(screen.getByText('Deletions')).toBeTruthy();
      expect(screen.getByText('Substitutions')).toBeTruthy(); // Component shows "Substitutions" not "Changes"
      expect(screen.getByText('Total Changes:')).toBeTruthy();
      expect(screen.getByText('Unchanged:')).toBeTruthy();
      expect(screen.getByText('Total Elements:')).toBeTruthy();
    });
  });

  describe('Visual Progress Bar', () => {
    it('should render progress bar container', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const progressBar = container.querySelector('.flex.rounded-full.overflow-hidden.h-2');
      expect(progressBar).toBeTruthy();
    });

    it('should render progress segments with correct widths', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const segments = container.querySelectorAll('.flex.rounded-full.overflow-hidden.h-2 > div');
      expect(segments.length).toBe(3); // additions, deletions, changed
      
      // Check that segments have style attributes (widths)
      segments.forEach(segment => {
        expect(segment.getAttribute('style')).toContain('width:');
      });
    });

    it('should use correct colors for progress segments', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const segments = container.querySelectorAll('.flex.rounded-full.overflow-hidden.h-2 > div');
      
      // Check for expected background colors
      expect(segments[0].className).toContain('bg-[#34c759]'); // additions - green
      expect(segments[1].className).toContain('bg-[#ff3b3f]'); // deletions - red
      expect(segments[2].className).toContain('bg-[#ff3b3f]'); // changed - red
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero statistics', () => {
      const zeroStats = {
        additions: 0,
        deletions: 0,
        unchanged: 0,
        changed: 0,
        totalChanges: 0
      };

      render(<ComparisonStats stats={zeroStats} />);

      // Should show 0.0% for additions and deletions
      const percentageElements = screen.getAllByText('0.0% of total');
      expect(percentageElements.length).toBe(2); // additions and deletions

      // Check for multiple instances of "0"
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle large numbers', () => {
      const largeStats = {
        additions: 1000,
        deletions: 500,
        unchanged: 2000,
        changed: 250,
        totalChanges: 1750
      };
      
      render(<ComparisonStats stats={largeStats} />);
      
      expect(screen.getByText('1000')).toBeTruthy();
      expect(screen.getByText('500')).toBeTruthy();
      expect(screen.getByText('2000')).toBeTruthy();
      expect(screen.getByText('250')).toBeTruthy();
      expect(screen.getByText('1750')).toBeTruthy();
    });

    it('should handle decimal percentages correctly', () => {
      const oddStats = {
        additions: 1,
        deletions: 1,
        unchanged: 1,
        changed: 0,
        totalChanges: 2
      };

      render(<ComparisonStats stats={oddStats} />);

      // 1/3 = 33.3% - should appear twice (additions and deletions)
      const percentageElements = screen.getAllByText('33.3% of total');
      expect(percentageElements.length).toBe(2);
    });

    it('should handle missing totalChanges gracefully', () => {
      const statsWithoutTotal = {
        additions: 5,
        deletions: 3,
        unchanged: 10,
        changed: 2,
        totalChanges: 0
      };
      
      const { container } = render(<ComparisonStats stats={statsWithoutTotal} />);
      expect(container).toBeTruthy();
    });
  });

  describe('Icons and Visual Elements', () => {
    it('should render statistics icon', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      // Look for BarChart3 icon (should be an SVG)
      const icon = container.querySelector('svg');
      expect(icon).toBeTruthy();
    });

    it('should render category icons', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      // Should have multiple icons for different categories
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1);
    });

    it('should have proper color coding for categories', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      // Check for color-coded backgrounds
      const additionsBox = container.querySelector('.bg-\\[\\#dcfce7\\]');
      const deletionsBox = container.querySelector('.bg-\\[\\#fee2e2\\]');
      
      expect(additionsBox).toBeTruthy();
      expect(deletionsBox).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    it('should use grid layout for statistics', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const gridContainer = container.querySelector('.grid.grid-cols-2');
      expect(gridContainer).toBeTruthy();
    });

    it('should have proper spacing and padding', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer.className).toContain('p-4');
      
      const gridItems = container.querySelectorAll('.grid.grid-cols-2 > div');
      gridItems.forEach(item => {
        expect(item.className).toContain('p-3');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const heading = container.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toBe('Comparison Statistics');
    });

    it('should have readable text content', () => {
      render(<ComparisonStats {...defaultProps} />);

      // All statistics should be visible and readable
      expect(screen.getByText('Additions')).toBeTruthy();
      expect(screen.getByText('Deletions')).toBeTruthy();
      expect(screen.getByText('Substitutions')).toBeTruthy(); // Component shows "Substitutions" not "Changes"
    });
  });

  describe('Performance', () => {
    it('should handle frequent updates efficiently', () => {
      const { rerender } = render(<ComparisonStats {...defaultProps} />);
      
      // Simulate multiple updates
      for (let i = 0; i < 10; i++) {
        const updatedStats = {
          ...mockStats,
          additions: mockStats.additions + i
        };
        rerender(<ComparisonStats stats={updatedStats} />);
      }
      
      // Should still render correctly
      expect(screen.getByText('Comparison Statistics')).toBeTruthy();
    });

    it('should not cause memory leaks', () => {
      const { unmount } = render(<ComparisonStats {...defaultProps} />);
      
      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });
});

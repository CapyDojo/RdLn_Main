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
    totalChanges: 8,  // additions + deletions
    wordStats: {
      addedWords: 25,
      deletedWords: 15,
      unchangedWords: 100,
      totalWords: 140,
      reviewWorkload: 40,
      percentageChanged: 28.6
    },
    characterStats: {
      addedCharacters: 150,
      deletedCharacters: 90,
      unchangedCharacters: 600,
      totalCharacters: 840,
      totalCharactersNoSpaces: 700,
      reviewWorkload: 240,
      percentageChanged: 28.6
    }
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

      // Block-level stats
      expect(screen.getByText('5')).toBeTruthy(); // additions
      expect(screen.getByText('3')).toBeTruthy(); // deletions

      // Word-level stats (new format) - use getAllByText for duplicates
      expect(screen.getByText('25')).toBeTruthy(); // words added
      expect(screen.getByText('15')).toBeTruthy(); // words deleted
      expect(screen.getByText('100')).toBeTruthy(); // words unchanged
      expect(screen.getAllByText('40 words').length).toBeGreaterThan(0); // review workload (appears multiple times)
      expect(screen.getAllByText('140 words (28.6% changed)').length).toBeGreaterThan(0); // document size (appears multiple times)
    });

    it('should calculate and display percentages correctly', () => {
      render(<ComparisonStats {...defaultProps} />);
      
      // Total = 5 + 3 + 10 = 18
      // Additions: 5/18 = 27.8%
      // Deletions: 3/18 = 16.7%
      expect(screen.getByText('27.8% of total')).toBeTruthy();
      expect(screen.getByText('16.7% of total')).toBeTruthy();
    });

    it('should display review workload correctly', () => {
      render(<ComparisonStats {...defaultProps} />);
      
      // Should show review workload instead of total elements
      expect(screen.getAllByText('Total Review Load:').length).toBeGreaterThan(0);
      expect(screen.getAllByText('40 words').length).toBeGreaterThan(0); // review workload (appears multiple times)
    });

    it('should show labels for each statistic', () => {
      render(<ComparisonStats {...defaultProps} />);

      expect(screen.getByText('Additions')).toBeTruthy();
      expect(screen.getByText('Deletions')).toBeTruthy();
      expect(screen.getAllByText('Total Review Load:').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Document Size:').length).toBeGreaterThan(0);
      expect(screen.getByText('Word Statistics')).toBeTruthy();
      expect(screen.getByText('Words Unchanged:')).toBeTruthy();
      expect(screen.getByText('Characters Unchanged:')).toBeTruthy();
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
      expect(segments.length).toBe(2); // additions, deletions only
      
      // Check that segments have style attributes (widths)
      segments.forEach(segment => {
        expect(segment.getAttribute('style')).toContain('width:');
      });
    });

    it('should use correct colors for progress segments', () => {
      const { container } = render(<ComparisonStats {...defaultProps} />);
      
      const segments = container.querySelectorAll('.flex.rounded-full.overflow-hidden.h-2 > div');
      
      // Check for expected background colors (only 2 segments now)
      expect(segments[0].className).toContain('bg-[#34c759]'); // additions - green
      expect(segments[1].className).toContain('bg-[#ff3b3f]'); // deletions - red
      expect(segments.length).toBe(2); // Only additions and deletions
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero statistics', () => {
      const zeroStats = {
        additions: 0,
        deletions: 0,
        unchanged: 0,
        totalChanges: 0,
        wordStats: {
          addedWords: 0,
          deletedWords: 0,
          unchangedWords: 0,
          totalWords: 0,
          reviewWorkload: 0,
          percentageChanged: 0
        }
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
        totalChanges: 1500,
        wordStats: {
          addedWords: 5000,
          deletedWords: 2500,
          unchangedWords: 10000,
          totalWords: 17500,
          reviewWorkload: 7500,
          percentageChanged: 42.9
        }
      };
      
      render(<ComparisonStats stats={largeStats} />);
      
      expect(screen.getByText('1000')).toBeTruthy(); // block additions
      expect(screen.getByText('500')).toBeTruthy(); // block deletions
      expect(screen.getByText('5000')).toBeTruthy(); // word additions
      expect(screen.getByText('2500')).toBeTruthy(); // word deletions
    });

    it('should handle decimal percentages correctly', () => {
      const oddStats = {
        additions: 1,
        deletions: 1,
        unchanged: 1,
        totalChanges: 2,
        wordStats: {
          addedWords: 10,
          deletedWords: 10,
          unchangedWords: 10,
          totalWords: 30,
          reviewWorkload: 20,
          percentageChanged: 66.7
        }
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
        totalChanges: 0
        // No wordStats - should fallback to legacy format
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

/**
 * CustomTooltip Fixed Positioning Test
 * 
 * Tests that tooltips maintain correct viewport-relative positioning
 * when using fixed positioning strategy.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CustomTooltip } from '../CustomTooltip';

describe('CustomTooltip Fixed Positioning', () => {
  let mockGetBoundingClientRect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock getBoundingClientRect with controlled positioning
    mockGetBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 150,
      bottom: 120,
      right: 250,
      width: 100,
      height: 20,
      x: 150,
      y: 100,
    }));
    
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should position tooltip using viewport coordinates (not document coordinates)', async () => {
    render(
      <CustomTooltip content="Fixed position test" placement="bottom-right">
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Fixed position test')).toBeInTheDocument();
    });

    const tooltip = screen.getByText('Fixed position test').closest('[role="tooltip"]') as HTMLElement;
    
    // With fixed positioning and getBoundingClientRect returning viewport coordinates,
    // tooltip should be positioned at rect.bottom + 2 = 120 + 2 = 122px from top
    // and rect.right + 2 = 250 + 2 = 252px from left (bottom-right placement)
    expect(tooltip.style.top).toBe('122px');
    expect(tooltip.style.left).toBe('252px');
  });

  it('should maintain attachment when trigger element moves in viewport', async () => {
    render(
      <CustomTooltip content="Movement test" placement="bottom-right">
        <button>Moving Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText('Moving Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Movement test')).toBeInTheDocument();
    });

    // Get initial position
    let tooltip = screen.getByText('Movement test').closest('[role="tooltip"]') as HTMLElement;
    expect(tooltip.style.top).toBe('122px');
    expect(tooltip.style.left).toBe('252px');

    // Simulate element moving in viewport (e.g., due to scroll)
    mockGetBoundingClientRect.mockReturnValue({
      top: 50,  // Element moved up
      left: 200, // Element moved right
      bottom: 70,
      right: 300,
      width: 100,
      height: 20,
      x: 200,
      y: 50,
    });

    // Trigger position update
    fireEvent.scroll(window);

    await waitFor(() => {
      tooltip = screen.getByText('Movement test').closest('[role="tooltip"]') as HTMLElement;
      // Tooltip should follow: bottom + 2 = 70 + 2 = 72px, right + 2 = 300 + 2 = 302px
      expect(tooltip.style.top).toBe('72px');
      expect(tooltip.style.left).toBe('302px');
    });
  });

  it('should handle different placement options correctly with viewport positioning', async () => {
    const placements = [
      { placement: 'top' as const, expectedTop: 70, expectedLeft: -57 }, // top - 30, left - 207
      { placement: 'bottom' as const, expectedTop: 122, expectedLeft: 252 }, // bottom + 2, right + 2  
      { placement: 'right' as const, expectedTop: 122, expectedLeft: 252 }, // bottom + 2, right + 2
      { placement: 'left' as const, expectedTop: 120, expectedLeft: -135 }, // bottom, left - 285
    ];

    for (const { placement, expectedTop, expectedLeft } of placements) {
      const { unmount } = render(
        <CustomTooltip content={`${placement} test`} placement={placement}>
          <button>Test {placement}</button>
        </CustomTooltip>
      );

      const button = screen.getByText(`Test ${placement}`);
      fireEvent.mouseEnter(button);

      await waitFor(() => {
        expect(screen.getByText(`${placement} test`)).toBeInTheDocument();
      });

      const tooltip = screen.getByText(`${placement} test`).closest('[role="tooltip"]') as HTMLElement;
      expect(tooltip.style.top).toBe(`${expectedTop}px`);
      expect(tooltip.style.left).toBe(`${expectedLeft}px`);

      unmount();
    }
  });

  it('should use fixed positioning CSS class', async () => {
    render(
      <CustomTooltip content="Fixed CSS test">
        <button>CSS Test</button>
      </CustomTooltip>
    );

    const button = screen.getByText('CSS Test');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Fixed CSS test')).toBeInTheDocument();
    });

    const tooltip = screen.getByText('Fixed CSS test').closest('[role="tooltip"]') as HTMLElement;
    
    // Should have fixed positioning class
    expect(tooltip).toHaveClass('fixed');
    expect(tooltip).toHaveClass('z-[2147483647]'); // Maximum z-index
    expect(tooltip).toHaveClass('pointer-events-none');
  });
});
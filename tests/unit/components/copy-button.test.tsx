import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from '@/components/CopyButton';
import { DiffChange } from '@/types';
import { createMockChanges } from '@/testing/test-utils';

// Mock the dependencies
vi.mock('@/components/CustomTooltip', () => ({
  CustomTooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  )
}));

vi.mock('@/utils/clipboardUtils', () => ({
  copyToClipboardMultiFormat: vi.fn(),
  isMultiFormatClipboardSupported: vi.fn()
}));

vi.mock('@/utils/performanceUtils.tsx', () => ({
  usePerformanceAwareHandler: vi.fn((fn) => fn),
  useComponentPerformance: vi.fn(() => ({
    trackMetric: vi.fn()
  }))
}));

// Import mocked functions with proper typing
import { copyToClipboardMultiFormat, isMultiFormatClipboardSupported } from '@/utils/clipboardUtils';

describe('CopyButton', () => {
  const mockOnCopy = vi.fn();
  const mockCopyToClipboard = copyToClipboardMultiFormat as any;
  const mockIsMultiFormat = isMultiFormatClipboardSupported as any;

  const defaultProps = {
    changes: createMockChanges(3),
    onCopy: mockOnCopy,
  };

  const renderComponent = (overrideProps = {}) => {
    const props = { ...defaultProps, ...overrideProps };
    return render(<CopyButton {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMultiFormat.mockReturnValue(true);
    mockCopyToClipboard.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('renders with default props', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Copy comparison results with HTML formatting');
    });

    it('does not render when changes array is empty', () => {
      renderComponent({ changes: [] });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when changes is null', () => {
      renderComponent({ changes: null });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render when changes is undefined', () => {
      renderComponent({ changes: undefined });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('has correct dimensions styling', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: '48px',
        height: '48px',
        aspectRatio: '1/1'
      });
    });
  });

  describe('clipboard support detection', () => {
    it('shows HTML formatting tooltip when multi-format is supported', () => {
      mockIsMultiFormat.mockReturnValue(true);
      renderComponent();

      expect(screen.getByTitle('Copy RdLn - formatted for pasting into Emails')).toBeInTheDocument();
    });

    it('shows plain text tooltip when multi-format is not supported', () => {
      mockIsMultiFormat.mockReturnValue(false);
      renderComponent();

      expect(screen.getByTitle('Copy RdLn as plain text')).toBeInTheDocument();
    });

    it('updates aria-label based on clipboard support', () => {
      const { rerender } = renderComponent();
      mockIsMultiFormat.mockReturnValue(true);
      
      rerender(<CopyButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Copy comparison results with HTML formatting'
      );

      mockIsMultiFormat.mockReturnValue(false);
      rerender(<CopyButton {...defaultProps} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Copy comparison results as plain text'
      );
    });
  });

  describe('copy functionality', () => {
    it('calls copyToClipboardMultiFormat with changes', async () => {
      const user = userEvent.setup();
      const testChanges = createMockChanges(2);
      
      renderComponent({ changes: testChanges });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockCopyToClipboard).toHaveBeenCalledWith(testChanges);
    });

    it('calls onCopy callback after successful copy', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledOnce();
      });
    });

    it('does not attempt copy when disabled', async () => {
      const user = userEvent.setup();
      
      renderComponent({ disabled: true });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
    });

    it('does not attempt copy with invalid changes', async () => {
      const user = userEvent.setup();
      
      renderComponent({ changes: 'invalid' as any });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
    });
  });

  describe('success feedback', () => {
    it('shows success state after successful copy', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Check visual feedback
      expect(button).toHaveClass('bg-green-100', 'border-green-300');
      expect(button).toHaveStyle({ transform: 'scale(1.05)' });
    });

    it('resets success state after timeout', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      
      renderComponent();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      // Fast-forward past the timeout
      vi.advanceTimersByTime(1600);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('shows copy icon initially', () => {
      renderComponent();

      expect(screen.getByText('Copy')).toBeInTheDocument();
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('calls onCopy even when copy operation fails', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCopyToClipboard.mockRejectedValue(new Error('Copy failed'));
      
      renderComponent();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledOnce();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error));
    });

    it('handles non-Error exceptions gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockCopyToClipboard.mockRejectedValue('String error');
      
      renderComponent();

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(mockOnCopy).toHaveBeenCalledOnce();
      });
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling when disabled', () => {
      renderComponent({ disabled: true });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(button).toBeDisabled();
    });

    it('prevents interaction when disabled', async () => {
      const user = userEvent.setup();
      
      renderComponent({ disabled: true });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockCopyToClipboard).not.toHaveBeenCalled();
      expect(mockOnCopy).not.toHaveBeenCalled();
    });
  });

  describe('responsive design', () => {
    it('hides text labels on small screens', () => {
      renderComponent();

      const textSpan = screen.getByText('Copy');
      expect(textSpan).toHaveClass('hidden', 'sm:block');
    });

    it('shows text labels on larger screens', () => {
      renderComponent();

      const textSpan = screen.getByText('Copy');
      expect(textSpan).toHaveClass('sm:block');
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      
      const icon = button.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockCopyToClipboard).toHaveBeenCalled();
    });

    it('maintains focus visibility', () => {
      renderComponent();

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });
  });

  describe('edge cases', () => {
    it('handles empty changes array gracefully', () => {
      renderComponent({ changes: [] });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calculates text length correctly for different change types', async () => {
      const user = userEvent.setup();
      const changedChange: DiffChange = {
        type: 'changed',
        originalContent: 'old text',
        revisedContent: 'new text',
        content: 'fallback'
      };
      
      renderComponent({ changes: [changedChange] });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockCopyToClipboard).toHaveBeenCalledWith([changedChange]);
    });

    it('handles rapid consecutive clicks', async () => {
      const user = userEvent.setup();
      
      renderComponent();

      const button = screen.getByRole('button');
      
      // Click multiple times rapidly
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockCopyToClipboard).toHaveBeenCalledTimes(3);
      expect(mockOnCopy).toHaveBeenCalledTimes(3);
    });
  });
});
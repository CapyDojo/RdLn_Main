import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FullScreenButton, FullScreenButtonCompact } from '@/components/FullScreenButton';

// Mock the CustomTooltip component to avoid complex dependencies
vi.mock('@/components/CustomTooltip', () => ({
  CustomTooltip: ({ children, content }: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  )
}));

describe('FullScreenButton', () => {
  const defaultProps = {
    isFullScreen: false,
    onToggle: vi.fn(),
    hasResults: true,
  };

  const renderComponent = (overrideProps = {}) => {
    const props = { ...defaultProps, ...overrideProps };
    return render(<FullScreenButton {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with default props', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Open RdLn in full-screen');
    });

    it('does not render when hasResults is false', () => {
      renderComponent({ hasResults: false });

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

  describe('full screen state', () => {
    it('shows maximize icon when not in full screen', () => {
      renderComponent({ isFullScreen: false });

      const icon = screen.getByLabelText('Open RdLn in full-screen').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(screen.getByText('Full')).toBeInTheDocument();
    });

    it('shows minimize icon when in full screen', () => {
      renderComponent({ isFullScreen: true });

      const button = screen.getByLabelText('Return to normal view');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Exit')).toBeInTheDocument();
    });

    it('updates aria-label based on full screen state', () => {
      const { rerender } = renderComponent({ isFullScreen: false });
      
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Open RdLn in full-screen'
      );

      rerender(<FullScreenButton {...defaultProps} isFullScreen={true} />);
      
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Return to normal view'
      );
    });

    it('shows appropriate tooltip content based on state', () => {
      const { rerender } = renderComponent({ isFullScreen: false });
      
      expect(screen.getByTitle('Open RdLn in full-screen')).toBeInTheDocument();

      rerender(<FullScreenButton {...defaultProps} isFullScreen={true} />);
      
      expect(screen.getByTitle('Return to normal view')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onToggle when clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      
      renderComponent({ onToggle });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('handles multiple clicks', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      
      renderComponent({ onToggle });

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });

    it('is accessible via keyboard', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      
      renderComponent({ onToggle });

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(onToggle).toHaveBeenCalledOnce();
    });
  });

  describe('text labels', () => {
    it('shows Full text when not in full screen', () => {
      renderComponent({ isFullScreen: false });
      
      expect(screen.getByText('Full')).toBeInTheDocument();
      expect(screen.queryByText('Exit')).not.toBeInTheDocument();
    });

    it('shows Exit text when in full screen', () => {
      renderComponent({ isFullScreen: true });
      
      expect(screen.getByText('Exit')).toBeInTheDocument();
      expect(screen.queryByText('Full')).not.toBeInTheDocument();
    });

    it('has responsive text styling', () => {
      renderComponent();

      const textSpan = screen.getByText('Full');
      expect(textSpan).toHaveClass('hidden', 'sm:block');
    });
  });
});

describe('FullScreenButtonCompact', () => {
  const defaultProps = {
    isFullScreen: false,
    onToggle: vi.fn(),
    hasResults: true,
  };

  const renderComponent = (overrideProps = {}) => {
    const props = { ...defaultProps, ...overrideProps };
    return render(<FullScreenButtonCompact {...props} />);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compact variant behavior', () => {
    it('renders with same structure as regular button', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Open RdLn in full-screen');
    });

    it('does not render when hasResults is false', () => {
      renderComponent({ hasResults: false });

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onToggle when clicked', async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();
      
      renderComponent({ onToggle });

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('shows correct icons based on state', () => {
      const { rerender } = renderComponent({ isFullScreen: false });
      
      expect(screen.getByLabelText('Open RdLn in full-screen')).toBeInTheDocument();

      rerender(<FullScreenButtonCompact {...defaultProps} isFullScreen={true} />);
      
      expect(screen.getByLabelText('Return to normal view')).toBeInTheDocument();
    });

    it('has same dimensions as regular button', () => {
      renderComponent();

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        width: '48px',
        height: '48px',
        aspectRatio: '1/1'
      });
    });
  });
});

describe('FullScreenButton and FullScreenButtonCompact consistency', () => {
  it('both components have identical API', () => {
    const props = {
      isFullScreen: false,
      onToggle: vi.fn(),
      hasResults: true,
      className: 'test-class'
    };

    const regularResult = render(<FullScreenButton {...props} />);
    const regularButton = regularResult.getByRole('button');
    regularResult.unmount();

    const compactResult = render(<FullScreenButtonCompact {...props} />);
    const compactButton = compactResult.getByRole('button');

    // Both should have the same aria-label
    expect(regularButton.getAttribute('aria-label')).toBe(
      compactButton.getAttribute('aria-label')
    );

    // Both should apply the same className
    expect(regularButton).toHaveClass('test-class');
    expect(compactButton).toHaveClass('test-class');
  });

  it('both components respect hasResults prop equally', () => {
    const props = {
      isFullScreen: false,
      onToggle: vi.fn(),
      hasResults: false,
    };

    const regularResult = render(<FullScreenButton {...props} />);
    const compactResult = render(<FullScreenButtonCompact {...props} />);

    expect(regularResult.queryByRole('button')).not.toBeInTheDocument();
    expect(compactResult.queryByRole('button')).not.toBeInTheDocument();
  });
});
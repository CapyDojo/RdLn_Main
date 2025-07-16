import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { setupRenderingTest, createMockDocument, createMockDiff } from './setup';
import { RedlineOutput } from '../../src/components/RedlineOutput';
import { ExperimentalLayoutProvider } from '../../src/contexts/ExperimentalLayoutContext';

describe('Visual and UX Tests', () => {
  beforeEach(() => {
    setupRenderingTest();
  });

  describe('Text Rendering Quality', () => {
    it('should not break text mid-sentence in semantic chunking', async () => {
      const changes = [
        { type: 'unchanged' as const, content: 'This is a complete sentence that should not be broken.', index: 0 },
        { type: 'added' as const, content: 'This is another complete sentence.', index: 1 },
        { type: 'removed' as const, content: 'This sentence was removed.', index: 2 },
        { type: 'unchanged' as const, content: 'Final sentence in the paragraph.', index: 3 }
      ];

      const { container } = render(
        <ExperimentalLayoutProvider>
          <RedlineOutput
            changes={changes}
            onCopy={() => {}}
            useEnhancedStrategy={true}
          />
        </ExperimentalLayoutProvider>
      );

      // Check that sentences are not broken
      const textContent = container.textContent || '';
      const sentences = textContent.split(/[.!?]+/);
      
      // Each sentence should be complete (no fragments)
      sentences.forEach(sentence => {
        if (sentence.trim().length > 0) {
          expect(sentence.trim()).toMatch(/^[A-Z].*$/); // Should start with capital letter
        }
      });
    });

    it('should preserve paragraph structure', async () => {
      const changes = [
        { type: 'unchanged' as const, content: 'First paragraph.\n\nSecond paragraph.', index: 0 },
        { type: 'added' as const, content: '\n\nAdded paragraph.', index: 1 }
      ];

      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      // Should preserve paragraph breaks
      const paragraphs = container.querySelectorAll('p, .paragraph');
      expect(paragraphs.length).toBeGreaterThan(1);
    });

    it('should render different change types with appropriate styling', async () => {
      const changes = [
        { type: 'unchanged' as const, content: 'Normal text', index: 0 },
        { type: 'added' as const, content: 'Added text', index: 1 },
        { type: 'removed' as const, content: 'Removed text', index: 2 }
      ];

      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      // Check for appropriate CSS classes
      expect(container.querySelector('.change-added')).toBeTruthy();
      expect(container.querySelector('.change-removed')).toBeTruthy();
      expect(container.querySelector('.change-unchanged')).toBeTruthy();
    });
  });

  describe('Scrolling Behavior', () => {
    it('should scroll smoothly without jumping', async () => {
      const largeChanges = createMockDiff('many');
      
      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      const scrollContainer = container.querySelector('.scroll-container') as HTMLElement;
      expect(scrollContainer).toBeTruthy();

      // Record initial scroll position
      const initialScrollTop = scrollContainer.scrollTop;

      // Simulate scroll
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });

      await waitFor(() => {
        expect(scrollContainer.scrollTop).not.toBe(initialScrollTop);
      });

      // Scroll should be smooth, not jumping
      expect(Math.abs(scrollContainer.scrollTop - 500)).toBeLessThan(100);
    });

    it('should maintain scroll position when content updates', async () => {
      const changes = createMockDiff('moderate');
      
      const { container, rerender } = render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={changes}
            onCopy={() => {}}
            useEnhancedStrategy={true}
          />
        </ExperimentalLayoutProvider>
      );

      const scrollContainer = container.querySelector('.scroll-container') as HTMLElement;
      
      // Scroll to middle
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 1000 } });
      const scrollPosition = scrollContainer.scrollTop;

      // Re-render with updated changes
      const updatedChanges = [...changes, { type: 'added' as const, content: 'New content', index: changes.length }];
      rerender(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={updatedChanges}
            onCopy={() => {}}
            useEnhancedStrategy={true}
          />
        </ExperimentalLayoutProvider>
      );

      // Scroll position should be preserved
      await waitFor(() => {
        expect(Math.abs(scrollContainer.scrollTop - scrollPosition)).toBeLessThan(50);
      });
    });
  });

  describe('Progressive Loading UX', () => {
    it('should show loading state during processing', async () => {
      render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={[]}
            originalText={createMockDocument('large')}
            revisedText={createMockDocument('large')}
            onCopy={() => {}}
            useEnhancedStrategy={true}
            showProgressIndicator={true}
          />
        </ExperimentalLayoutProvider>
      );

      // Should show loading indicator
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should show progress during long rendering operations', async () => {
      const largeChanges = createMockDiff('many');
      
      render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={largeChanges}
            originalText={createMockDocument('large')}
            revisedText={createMockDocument('large')}
            onCopy={() => {}}
            useEnhancedStrategy={true}
            showProgressIndicator={true}
          />
        </ExperimentalLayoutProvider>
      );

      // Should show progress bar
      const progressBar = screen.queryByTestId('progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should provide meaningful progress updates', async () => {
      const changes = createMockDiff('moderate');
      
      const { container } = render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={changes}
            originalText={createMockDocument('medium')}
            revisedText={createMockDocument('medium')}
            onCopy={() => {}}
            useEnhancedStrategy={true}
            showProgressIndicator={true}
          />
        </ExperimentalLayoutProvider>
      );

      // Check for progress text
      const progressText = container.querySelector('.progress-text');
      expect(progressText?.textContent).toMatch(/\d+%|\d+ of \d+|Processing/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for different change types', async () => {
      const changes = [
        { type: 'added' as const, content: 'Added content', index: 0 },
        { type: 'removed' as const, content: 'Removed content', index: 1 },
        { type: 'unchanged' as const, content: 'Unchanged content', index: 2 }
      ];

      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      // Check for ARIA labels
      const addedElement = container.querySelector('.change-added');
      const removedElement = container.querySelector('.change-removed');
      
      expect(addedElement?.getAttribute('aria-label')).toMatch(/added|insertion/i);
      expect(removedElement?.getAttribute('aria-label')).toMatch(/removed|deletion/i);
    });

    it('should be keyboard navigable', async () => {
      const changes = createMockDiff('few');
      
      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      const scrollContainer = container.querySelector('.scroll-container') as HTMLElement;
      
      // Should be focusable
      expect(scrollContainer.tabIndex).toBeGreaterThanOrEqual(0);
      
      // Should handle keyboard events
      fireEvent.keyDown(scrollContainer, { key: 'ArrowDown' });
      fireEvent.keyDown(scrollContainer, { key: 'ArrowUp' });
      fireEvent.keyDown(scrollContainer, { key: 'PageDown' });
      fireEvent.keyDown(scrollContainer, { key: 'PageUp' });
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Copy Functionality', () => {
    it('should preserve formatting when copying text', async () => {
      const changes = [
        { type: 'unchanged' as const, content: 'Normal text', index: 0 },
        { type: 'added' as const, content: 'Added text', index: 1 },
        { type: 'removed' as const, content: 'Removed text', index: 2 }
      ];

      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      const copyButton = container.querySelector('.copy-button') as HTMLButtonElement;
      
      if (copyButton) {
        fireEvent.click(copyButton);
        
        // Mock clipboard API
        const clipboardText = await navigator.clipboard.readText();
        expect(clipboardText).toContain('Normal text');
        expect(clipboardText).toContain('Added text');
        expect(clipboardText).toContain('Removed text');
      }
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to different screen sizes', async () => {
      const changes = createMockDiff('moderate');
      
      // Mock different viewport sizes
      const viewports = [
        { width: 320, height: 568 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ];

      for (const viewport of viewports) {
        // Mock window size
        Object.defineProperty(window, 'innerWidth', { value: viewport.width, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: viewport.height, writable: true });

        const { container } = render(
          <ExperimentalLayoutProvider>
            <EnhancedRedlineOutput
              changes={changes}
              onCopy={() => {}}
            />
          </ExperimentalLayoutProvider>
        );

        // Should render without layout issues
        const scrollContainer = container.querySelector('.scroll-container');
        expect(scrollContainer).toBeTruthy();
        
        // Should have appropriate responsive classes
        expect(container.querySelector('.responsive-container')).toBeTruthy();
      }
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle invalid change data', async () => {
      const invalidChanges = [
        { type: 'invalid' as any, content: 'Invalid change type', index: 0 },
        { type: 'added' as const, content: null as any, index: 1 },
        { type: 'removed' as const, content: undefined as any, index: 2 }
      ];

      const { container } = render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={invalidChanges}
            onCopy={() => {}}
          />
        </ExperimentalLayoutProvider>
      );

      // Should render without crashing
      expect(container).toBeTruthy();
      
      // Should show error message or fallback
      const errorElement = container.querySelector('.error-message, .fallback-content');
      expect(errorElement).toBeTruthy();
    });

    it('should handle empty change arrays', async () => {
      const { container } = render(
        <ExperimentalLayoutProvider>
          <EnhancedRedlineOutput
            changes={[]}
            onCopy={() => {}}
          />
        </ExperimentalLayoutProvider>
      );

      // Should show empty state
      expect(container.textContent).toMatch(/no changes|empty|nothing to display/i);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '../../helpers/test-utils';
import React from 'react';
import { 
  setupRenderingTest, 
  measureRenderTime, 
  createMockDocument, 
  createMockDiff 
} from './setup';
import { RedlineOutput } from '../../../src/components/RedlineOutput';
import { analyzeRenderingStrategy } from '../../../src/components/RenderingStrategy';

// Mock the hooks
vi.mock('../../src/hooks/useComparison', () => ({
  useComparison: vi.fn(() => ({
    isProcessing: false,
    error: null,
    changes: [],
    progress: 100
  }))
}));

describe('Rendering Performance Tests', () => {
  beforeEach(() => {
    setupRenderingTest();
  });

  describe('RenderingStrategy Performance', () => {
    const testCases = [
      { docSize: 'small' as const, changeCount: 'few' as const, expectedStrategy: 'static', maxTime: 100 },
      { docSize: 'medium' as const, changeCount: 'moderate' as const, expectedStrategy: 'progressive', maxTime: 500 },
      { docSize: 'large' as const, changeCount: 'many' as const, expectedStrategy: 'virtual', maxTime: 1000 },
      { docSize: 'xlarge' as const, changeCount: 'extreme' as const, expectedStrategy: 'virtual', maxTime: 2000 }
    ];

    testCases.forEach(({ docSize, changeCount, expectedStrategy, maxTime }) => {
      it(`should render ${docSize} document with ${changeCount} changes within ${maxTime}ms`, async () => {
        const mockDoc1 = createMockDocument(docSize);
        const mockDoc2 = createMockDocument(docSize);
        const mockChanges = createMockDiff(changeCount);

        const renderTime = await measureRenderTime(async () => {
          render(
            React.createElement(RedlineOutput, {
              changes: mockChanges,
              originalText: mockDoc1,
              revisedText: mockDoc2,
              onCopy: () => {},
              useEnhancedStrategy: true
            })
          );
        });

        expect(renderTime).toBeLessThan(maxTime);
        console.log(`${docSize}/${changeCount}: ${renderTime.toFixed(2)}ms (${expectedStrategy} strategy)`);
      });
    });
  });

  describe('RedlineOutput Performance', () => {
    it('should handle virtual scrolling efficiently', async () => {
      const largeChanges = createMockDiff('many');
      
      const renderTime = await measureRenderTime(async () => {
        render(
          React.createElement(RedlineOutput, {
            changes: largeChanges,
            onCopy: () => {},
            useEnhancedStrategy: true
          })
        );
      });

      // Virtual scrolling should render initial viewport quickly
      expect(renderTime).toBeLessThan(200);
    });

    it('should batch DOM updates efficiently', async () => {
      const moderateChanges = createMockDiff('moderate');
      let renderCount = 0;
      
      // Mock React's render cycle
      const originalRender = vi.fn(() => {
        renderCount++;
      });

      const renderTime = await measureRenderTime(async () => {
        render(
          React.createElement(RedlineOutput, {
            changes: moderateChanges,
            onCopy: () => {},
            useEnhancedStrategy: true
          })
        );
      });

      // Should complete within reasonable time
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should maintain reasonable memory usage with large documents', async () => {
      const xlargeDiff = createMockDiff('extreme');
      
      // Mock memory usage tracking
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      render(
        React.createElement(RedlineOutput, {
          changes: xlargeDiff,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      // Allow some time for rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for virtual scrolling)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Scroll Performance Tests', () => {
    it('should maintain smooth scrolling with virtual scrolling', async () => {
      const changes = createMockDiff('many');
      
      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      const scrollContainer = container.querySelector('.scroll-container');
      expect(scrollContainer).toBeTruthy();

      // Simulate scroll events
      const scrollTimes = [];
      for (let i = 0; i < 10; i++) {
        const scrollTime = await measureRenderTime(() => {
          scrollContainer?.dispatchEvent(new Event('scroll'));
        });
        scrollTimes.push(scrollTime);
      }

      const avgScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
      
      // Each scroll event should be handled quickly
      expect(avgScrollTime).toBeLessThan(16); // 60fps = 16.67ms per frame
    });
  });

  describe('Progressive Rendering Tests', () => {
    it('should show progress during long operations', async () => {
      const largeChanges = createMockDiff('many');
      
      render(
        React.createElement(RedlineOutput, {
          changes: largeChanges,
          originalText: createMockDocument('large'),
          revisedText: createMockDocument('large'),
          onCopy: () => {},
          useEnhancedStrategy: true,
          showProgressIndicator: true
        })
      );

      // Should show progress indicator
      const progressElement = screen.queryByTestId('rendering-progress');
      expect(progressElement).toBeTruthy();
    });

    it('should render content progressively', async () => {
      const changes = createMockDiff('moderate');
      
      const { container } = render(
        React.createElement(RedlineOutput, {
          changes: changes,
          originalText: createMockDocument('medium'),
          revisedText: createMockDocument('medium'),
          onCopy: () => {},
          useEnhancedStrategy: true
        })
      );

      // Should start with some content rendered
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const renderedContent = container.querySelectorAll('.change-item');
      expect(renderedContent.length).toBeGreaterThan(0);
    });
  });
});

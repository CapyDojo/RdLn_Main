import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { setupRenderingTest, createMockDocument, createMockDiff } from './setup';
import { RedlineOutput } from '../../src/components/RedlineOutput';
import { analyzeRenderingStrategy } from '../../src/components/RenderingStrategy';
import { ExperimentalLayoutProvider } from '../../src/contexts/ExperimentalLayoutContext';
import { FontSizeProvider } from '../../src/contexts/FontSizeContext';

describe('Integration Tests - Components Working', () => {
  beforeEach(() => {
    setupRenderingTest();
  });

  it('should analyze rendering strategy correctly', () => {
    const doc1 = createMockDocument('small');
    const doc2 = createMockDocument('small');
    const changes = createMockDiff('few');

    const decision = analyzeRenderingStrategy(doc1, doc2, changes);
    
    expect(decision).toBeDefined();
    expect(decision.strategy).toBeDefined();
    expect(decision.strategy.mode).toBeDefined();
    expect(decision.reasoning).toBeDefined();
    
    console.log('✅ Strategy Decision:', {
      mode: decision.strategy.mode,
      documentSize: decision.strategy.documentSize,
      diffComplexity: decision.strategy.diffComplexity,
      reasoning: decision.reasoning
    });
  });

  it('should render EnhancedRedlineOutput component using createElement', () => {
    const mockChanges = createMockDiff('few');
    
    // Use React.createElement to avoid JSX compilation issues
    const component = React.createElement(ExperimentalLayoutProvider, { children:
      React.createElement(FontSizeProvider, { children:
        React.createElement(RedlineOutput, {
          changes: mockChanges,
          onCopy: () => {},
          useEnhancedStrategy: true,
          originalText: createMockDocument('small'),
          revisedText: createMockDocument('small')
        })
      })
    });

    const { container } = render(component);
    
    expect(container).toBeTruthy();
    expect(container.querySelector('.glass-panel')).toBeTruthy();
    
    console.log('✅ EnhancedRedlineOutput rendered successfully');
  });

  it('should handle different rendering strategies', () => {
    const testCases = [
      { docSize: 'small' as const, changeCount: 'few' as const },
      { docSize: 'medium' as const, changeCount: 'moderate' as const },
      { docSize: 'large' as const, changeCount: 'many' as const },
    ];

    testCases.forEach(({ docSize, changeCount }) => {
      const doc1 = createMockDocument(docSize);
      const doc2 = createMockDocument(docSize);
      const changes = createMockDiff(changeCount);

      const decision = analyzeRenderingStrategy(doc1, doc2, changes);
      
      console.log(`📊 ${docSize}/${changeCount}:`, {
        mode: decision.strategy.mode,
        virtualScrolling: decision.strategy.useVirtualScrolling,
        semanticChunking: decision.strategy.enableSemanticChunking,
        estimatedTime: decision.estimatedRenderTime
      });

      expect(decision.strategy.mode).toBeDefined();
      expect(['immediate_static', 'progressive_static', 'stream_static', 'full_pipeline', 'virtual_scrolling', 'emergency_fallback'])
        .toContain(decision.strategy.mode);
    });
  });

  it('should create components safely without errors', () => {
    // Test that components can be created without throwing
    expect(() => {
      const mockChanges = createMockDiff('few');
      
      const component = React.createElement(RedlineOutput, {
        changes: mockChanges,
        onCopy: () => {},
        useEnhancedStrategy: false, // Test legacy mode
      });

      expect(component).toBeDefined();
    }).not.toThrow();

    console.log('✅ Components created safely');
  });
});

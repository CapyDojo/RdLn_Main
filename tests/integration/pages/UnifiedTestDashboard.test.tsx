import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedTestDashboard } from '../../src/pages/UnifiedTestDashboard';

// Mock the necessary components and hooks
vi.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: 'light' })
}));

vi.mock('../src/algorithms/MyersAlgorithm', () => ({
  MyersAlgorithm: {
    compare: vi.fn().mockReturnValue({
      changes: [],
      stats: {
        additions: 0,
        deletions: 0,
        unchanged: 0,
        changed: 0,
        totalChanges: 0
      }
    })
  }
}));

// Mock the test data
vi.mock('../src/data/test-cases.json', () => ({
  default: [
    {
      id: 'test-1',
      name: 'Test Case 1',
      description: 'Test description',
      category: 'Test Category',
      originalText: 'Original text',
      revisedText: 'Revised text'
    }
  ]
}));

vi.mock('../../../tests/fixtures/extreme-test-cases.json', () => ({
  default: [
    {
      id: 'extreme-test-1',
      name: 'Extreme Test Case 1',
      description: 'Extreme test description',
      category: 'Extreme Category',
      difficulty: 'Ultra',
      complexity: {
        wordCount: 100,
        sentenceCount: 10,
        expectedChanges: 5,
        nestingDepth: 3
      },
      originalText: 'Original text',
      revisedText: 'Revised text',
      expectedBehavior: {
        description: 'Expected behavior',
        criticalFeatures: ['Feature 1'],
        performanceExpectations: 'Performance expectations',
        edgeCases: ['Edge case 1']
      },
      stressTestAspects: ['Stress test aspect 1']
    }
  ]
}));

describe('UnifiedTestDashboard', () => {
  it('renders without crashing', () => {
    render(<UnifiedTestDashboard />);
    expect(screen.getByText('Unified Test Dashboard')).toBeInTheDocument();
  });

  it('displays the correct number of tests', () => {
    render(<UnifiedTestDashboard />);
    expect(screen.getByText('22 Total Tests')).toBeInTheDocument();
  });
});
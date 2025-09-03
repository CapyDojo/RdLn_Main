/**
 * Comprehensive Tests for ExperimentalLayoutContext
 * 
 * Tests the experimental features context that manages A/B testing
 * and feature flags for layout modifications.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { 
  ExperimentalLayoutProvider, 
  useExperimentalFeatures,
  useHasActiveExperimentalFeatures,
  useExperimentalCSSClasses
} from '../ExperimentalLayoutContext';

// Test component to access context
const TestComponent: React.FC<{ onFeaturesChange?: (features: any) => void }> = ({ onFeaturesChange }) => {
  const { features, toggleFeature, resetAllFeatures, enableTestGroup } = useExperimentalFeatures();
  const hasActiveFeatures = useHasActiveExperimentalFeatures();
  const cssClasses = useExperimentalCSSClasses();

  React.useEffect(() => {
    onFeaturesChange?.(features);
  }, [features, onFeaturesChange]);

  // Note: Not auto-resetting to allow tests to control state

  return (
    <div data-testid="test-component">
      <div data-testid="has-active-features">{hasActiveFeatures.toString()}</div>
      <div data-testid="css-classes">{cssClasses}</div>
      <div data-testid="features">{JSON.stringify(features)}</div>

      <button
        data-testid="toggle-spotlight"
        onClick={() => toggleFeature('resultsSpotlight')}
      >
        Toggle Spotlight
      </button>

      <button
        data-testid="toggle-overlay"
        onClick={() => toggleFeature('resultsOverlay')}
      >
        Toggle Overlay
      </button>

      <button
        data-testid="reset-all"
        onClick={resetAllFeatures}
      >
        Reset All
      </button>

      <button
        data-testid="enable-visual-group"
        onClick={() => enableTestGroup('visual-only')}
      >
        Enable Visual Group
      </button>

      <button
        data-testid="enable-navigation-group"
        onClick={() => enableTestGroup('navigation-enhanced')}
      >
        Enable Navigation Group
      </button>
    </div>
  );
};

// Helper function to reset features before each test
const resetFeatures = () => {
  const resetButton = screen.queryByTestId('reset-all');
  if (resetButton) {
    fireEvent.click(resetButton);
  }
};

describe('ExperimentalLayoutContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage to prevent persistence between tests
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('Provider Setup', () => {
    it('should provide context to children', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      expect(screen.getByTestId('test-component')).toBeTruthy();
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useExperimentalFeatures must be used within an ExperimentalLayoutProvider');
      
      consoleSpy.mockRestore();
    });

    it('should start with all features disabled', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const featuresElement = screen.getByTestId('features');
      const features = JSON.parse(featuresElement.textContent || '{}');
      
      // All features should be false initially
      Object.values(features).forEach(value => {
        expect(value).toBe(false);
      });
    });
  });

  describe('Feature Toggle Functionality', () => {
    it('should toggle individual features', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );

      // Reset features to ensure clean state
      resetFeatures();

      const toggleButton = screen.getByTestId('toggle-spotlight');
      const featuresElement = screen.getByTestId('features');

      // Initially false
      let features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(false);
      
      // Toggle to true
      fireEvent.click(toggleButton);
      features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
      
      // Toggle back to false
      fireEvent.click(toggleButton);
      features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(false);
    });

    it('should toggle multiple features independently', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const spotlightButton = screen.getByTestId('toggle-spotlight');
      const overlayButton = screen.getByTestId('toggle-overlay');
      const featuresElement = screen.getByTestId('features');
      
      // Enable spotlight
      fireEvent.click(spotlightButton);
      let features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
      expect(features.resultsOverlay).toBe(false);
      
      // Enable overlay
      fireEvent.click(overlayButton);
      features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
      expect(features.resultsOverlay).toBe(true);
      
      // Disable spotlight, overlay should remain
      fireEvent.click(spotlightButton);
      features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(false);
      expect(features.resultsOverlay).toBe(true);
    });

    it('should reset all features', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const spotlightButton = screen.getByTestId('toggle-spotlight');
      const overlayButton = screen.getByTestId('toggle-overlay');
      const resetButton = screen.getByTestId('reset-all');
      const featuresElement = screen.getByTestId('features');
      
      // Enable multiple features
      fireEvent.click(spotlightButton);
      fireEvent.click(overlayButton);
      
      let features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
      expect(features.resultsOverlay).toBe(true);
      
      // Reset all
      fireEvent.click(resetButton);
      features = JSON.parse(featuresElement.textContent || '{}');
      
      // All should be false
      Object.values(features).forEach(value => {
        expect(value).toBe(false);
      });
    });
  });

  describe('Test Group Functionality', () => {
    it('should enable visual-only test group', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const enableButton = screen.getByTestId('enable-visual-group');
      const featuresElement = screen.getByTestId('features');
      
      fireEvent.click(enableButton);
      const features = JSON.parse(featuresElement.textContent || '{}');
      
      // Should enable resultsSpotlight
      expect(features.resultsSpotlight).toBe(true);
      
      // Other features should remain false
      expect(features.floatingJumpButton).toBe(false);
      expect(features.mobileTabInterface).toBe(false);
    });

    it('should enable navigation-enhanced test group', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const enableButton = screen.getByTestId('enable-navigation-group');
      const featuresElement = screen.getByTestId('features');
      
      fireEvent.click(enableButton);
      const features = JSON.parse(featuresElement.textContent || '{}');
      
      // Should enable multiple navigation features
      expect(features.resultsSpotlight).toBe(true);
      expect(features.floatingJumpButton).toBe(true);
      expect(features.mobileTabInterface).toBe(true);
      
      // Other features should remain false
      expect(features.resultsOverlay).toBe(false);
      expect(features.resultsFirstAnimation).toBe(false);
    });

    it('should handle unknown test group gracefully', () => {
      const TestComponentWithUnknownGroup: React.FC = () => {
        const { enableTestGroup } = useExperimentalFeatures();
        
        return (
          <button 
            data-testid="enable-unknown-group" 
            onClick={() => enableTestGroup('unknown-group')}
          >
            Enable Unknown Group
          </button>
        );
      };

      render(
        <ExperimentalLayoutProvider>
          <TestComponentWithUnknownGroup />
        </ExperimentalLayoutProvider>
      );
      
      const enableButton = screen.getByTestId('enable-unknown-group');
      
      // Should not throw error
      expect(() => {
        fireEvent.click(enableButton);
      }).not.toThrow();
    });
  });

  describe('Helper Hooks', () => {
    it('should detect when features are active', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const hasActiveFeaturesElement = screen.getByTestId('has-active-features');
      const toggleButton = screen.getByTestId('toggle-spotlight');
      
      // Initially no active features
      expect(hasActiveFeaturesElement.textContent).toBe('false');
      
      // Enable a feature
      fireEvent.click(toggleButton);
      expect(hasActiveFeaturesElement.textContent).toBe('true');
      
      // Disable the feature
      fireEvent.click(toggleButton);
      expect(hasActiveFeaturesElement.textContent).toBe('false');
    });

    it('should generate CSS classes based on active features', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const cssClassesElement = screen.getByTestId('css-classes');
      const spotlightButton = screen.getByTestId('toggle-spotlight');
      const overlayButton = screen.getByTestId('toggle-overlay');
      
      // Initially no classes
      expect(cssClassesElement.textContent).toBe('');
      
      // Enable spotlight
      fireEvent.click(spotlightButton);
      expect(cssClassesElement.textContent).toContain('experimental-spotlight');
      
      // Enable overlay
      fireEvent.click(overlayButton);
      const classes = cssClassesElement.textContent || '';
      expect(classes).toContain('experimental-spotlight');
      expect(classes).toContain('experimental-overlay');
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const toggleButton = screen.getByTestId('toggle-spotlight');
      const featuresElement = screen.getByTestId('features');
      
      // Enable feature
      fireEvent.click(toggleButton);
      let features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
      
      // Re-render
      rerender(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      // State should be maintained
      features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(true);
    });

    it('should handle rapid feature toggles', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const toggleButton = screen.getByTestId('toggle-spotlight');
      const featuresElement = screen.getByTestId('features');
      
      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        fireEvent.click(toggleButton);
      }
      
      // Should end up false (started false, toggled even number of times)
      const features = JSON.parse(featuresElement.textContent || '{}');
      expect(features.resultsSpotlight).toBe(false);
    });
  });

  describe('Feature Categories', () => {
    it('should handle visual enhancement features', () => {
      const features = ['resultsSpotlight', 'floatingJumpButton', 'resultsPeekButton'];
      
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const enableButton = screen.getByTestId('enable-visual-group');
      fireEvent.click(enableButton);
      
      const featuresElement = screen.getByTestId('features');
      const enabledFeatures = JSON.parse(featuresElement.textContent || '{}');
      
      // Visual features should be enabled
      expect(enabledFeatures.resultsSpotlight).toBe(true);
    });

    it('should handle layout modification features', () => {
      render(
        <ExperimentalLayoutProvider>
          <TestComponent />
        </ExperimentalLayoutProvider>
      );
      
      const overlayButton = screen.getByTestId('toggle-overlay');
      fireEvent.click(overlayButton);
      
      const featuresElement = screen.getByTestId('features');
      const features = JSON.parse(featuresElement.textContent || '{}');
      
      expect(features.resultsOverlay).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle context updates gracefully', () => {
      const mockOnFeaturesChange = vi.fn();
      
      render(
        <ExperimentalLayoutProvider>
          <TestComponent onFeaturesChange={mockOnFeaturesChange} />
        </ExperimentalLayoutProvider>
      );
      
      const toggleButton = screen.getByTestId('toggle-spotlight');
      
      // Should call the callback when features change
      fireEvent.click(toggleButton);
      
      expect(mockOnFeaturesChange).toHaveBeenCalled();
    });
  });
});

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Experimental UX Features for "Results First" Testing
 * 
 * This context manages toggleable experimental features to address core UX pain points:
 * - "I have to scroll down and 'find' the output result"
 * - "Takes cognitive work to work out which panel I'm looking at" (mobile)
 * 
 * All features default to FALSE to ensure existing functionality is preserved.
 */

export interface ExperimentalFeatures {
  // Visual Enhancement Features (Low Risk)
  resultsSpotlight: boolean;              // #1: Animated entrance with gold border, contextual header
  floatingJumpButton: boolean;           // #7: Follows scroll, appears when results ready
  resultsPeekButton: boolean;            // #15: Floating preview button
  
  // Navigation Enhancement Features (Medium Risk)
  autoScrollToResults: boolean;          // #2: Automatically scroll to results when generated
  mobileTabInterface: boolean;           // #6: [INPUT] [RESULTS] [BOTH] tabs for mobile
  stickyResultsPanel: boolean;           // #16: Fixed position panel
  
  // Layout Modification Features (Higher Risk)
  resultsOverlay: boolean;               // #8: Temporary overlay then animate to position
  resultsFirstAnimation: boolean;        // #9: Output replaces input position with smooth animation
  refinedResultsFirst: boolean;          // #10: 2-second overlay then animate to top
  
  // Advanced Features (Complex)
  popoutResultsWindow: boolean;          // #12: Results open in separate browser window
  userConfigurableOrder: boolean;        // #13: Save user's preferred layout
}

interface ExperimentalLayoutContextType {
  features: ExperimentalFeatures;
  toggleFeature: (feature: keyof ExperimentalFeatures) => void;
  resetAllFeatures: () => void;
  enableTestGroup: (groupName: string) => void;
}

const ExperimentalLayoutContext = createContext<ExperimentalLayoutContextType | undefined>(undefined);

// Default state - ALL FEATURES OFF for safety
const defaultFeatures: ExperimentalFeatures = {
  // Visual Enhancement Features
  resultsSpotlight: false,
  floatingJumpButton: false,
  resultsPeekButton: false,
  
  // Navigation Enhancement Features
  autoScrollToResults: false,
  mobileTabInterface: false,
  stickyResultsPanel: false,
  
  // Layout Modification Features
  resultsOverlay: false,
  resultsFirstAnimation: false,
  refinedResultsFirst: false,
  
  // Advanced Features
  popoutResultsWindow: false,
  userConfigurableOrder: false,
};

// Predefined test groups for A/B testing
const testGroups = {
  'visual-only': {
    resultsSpotlight: true,
    autoScrollToResults: true,
  },
  'navigation-enhanced': {
    resultsSpotlight: true,
    autoScrollToResults: true,
    floatingJumpButton: true,
    mobileTabInterface: true,
  },
  'results-first': {
    resultsSpotlight: true,
    autoScrollToResults: true,
    resultsFirstAnimation: true,
  },
  'mobile-optimized': {
    mobileTabInterface: true,
    resultsOverlay: true,
  },
};

export const useExperimentalFeatures = () => {
  const context = useContext(ExperimentalLayoutContext);
  if (!context) {
    throw new Error('useExperimentalFeatures must be used within an ExperimentalLayoutProvider');
  }
  return context;
};

export const ExperimentalLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<ExperimentalFeatures>(() => {
    // Try to load from localStorage, fallback to defaults
    try {
      const saved = localStorage.getItem('experimental-features');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new features
        return { ...defaultFeatures, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load experimental features from localStorage:', error);
    }
    return defaultFeatures;
  });

  // Save to localStorage whenever features change
useEffect(() => {
    try {
      localStorage.setItem('experimental-features', JSON.stringify(features));
    } catch (error) {
      console.warn('Failed to save experimental features to localStorage:', error);
    }
  }, [features]);

  // Listen for storage events to sync changes across windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'experimental-features' && event.newValue) {
        try {
          const newFeatures = JSON.parse(event.newValue);
          setFeatures(prev => ({ ...prev, ...newFeatures }));
        } catch (error) {
          console.warn('Failed to parse experimental features from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFeature = (feature: keyof ExperimentalFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
    
    // Track usage for analytics (disabled to reduce console noise)
  };

  const resetAllFeatures = () => {
    setFeatures(defaultFeatures);
    // All experimental features reset to defaults
  };

  const enableTestGroup = (groupName: string) => {
    const group = testGroups[groupName as keyof typeof testGroups];
    if (group) {
      setFeatures(prev => ({
        ...defaultFeatures, // Start with all off
        ...group // Enable only the test group features
      }));
      // Test group enabled
    } else {
      // Unknown test group
    }
  };

  return (
    <ExperimentalLayoutContext.Provider value={{
      features,
      toggleFeature,
      resetAllFeatures,
      enableTestGroup
    }}>
      {children}
    </ExperimentalLayoutContext.Provider>
  );
};

// Helper hook for checking if any experimental features are active
export const useHasActiveExperimentalFeatures = () => {
  const { features } = useExperimentalFeatures();
  return Object.values(features).some(value => value === true);
};

// Helper hook for getting CSS classes based on active features
export const useExperimentalCSSClasses = () => {
  const { features } = useExperimentalFeatures();
  
  const classes: string[] = [];
  
  if (features.resultsSpotlight) classes.push('experimental-spotlight');
  if (features.floatingJumpButton) classes.push('experimental-floating-jump');
  if (features.resultsPeekButton) classes.push('experimental-peek-button');
  if (features.autoScrollToResults) classes.push('experimental-auto-scroll');
  if (features.mobileTabInterface) classes.push('experimental-mobile-tabs');
  if (features.stickyResultsPanel) classes.push('experimental-sticky-results');
  if (features.resultsOverlay) classes.push('experimental-overlay');
  if (features.resultsFirstAnimation) classes.push('experimental-results-first');
  if (features.refinedResultsFirst) classes.push('experimental-refined-results-first');
  if (features.popoutResultsWindow) classes.push('experimental-popout-window');
  if (features.userConfigurableOrder) classes.push('experimental-configurable-order');
  
  return classes.join(' ');
};

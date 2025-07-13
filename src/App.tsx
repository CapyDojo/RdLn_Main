import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ComparisonInterface } from './components/ComparisonInterface';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ExperimentalLayoutProvider, useExperimentalFeatures } from './contexts/ExperimentalLayoutContext';
import { OCRService } from './services/OCRService';
import { LogoTestPage } from './pages/LogoTestPage'; // Import the new LogoTestPage
import { CuppingTestPage } from './pages/CuppingTestPage'; // Import the cupping test page
import { DeveloperDashboard } from './pages/DeveloperDashboard'; // Import the developer dashboard
import BoundaryFragmentTest from './pages/BoundaryFragmentTest'; // Import the boundary fragment test page
import BoundaryFixTester from './components/BoundaryFixTester'; // Import the boundary fix tester component
import './styles/resize-overrides.css'; // SSMR CSS resize fixes

interface AppContentProps {
  showAdvancedOcrCard: boolean;
  showPerformanceDemoCard: boolean;
  showExtremeTestSuite: boolean;
  onToggleAdvancedOcr: () => void;
  onTogglePerformanceDemo: () => void;
  onToggleExtremeTestSuite: () => void;
}

function AppContent({
  showAdvancedOcrCard,
  showPerformanceDemoCard,
  showExtremeTestSuite,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo,
  onToggleExtremeTestSuite
}: AppContentProps) {
  const { themeConfig } = useTheme();
  
  // Get experimental features to check if results overlay is enabled
  const { features } = useExperimentalFeatures();
  
  // State for overlay visibility (only used when results overlay feature is enabled)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  
  // Overlay visibility handlers (only used when results overlay feature is enabled)
  const handleOverlayShow = () => {
    if (features.resultsOverlay) {
      setIsOverlayVisible(true);
      console.log(' App: Results overlay shown - hiding header');
    }
  };
  
  const handleOverlayHide = () => {
    if (features.resultsOverlay) {
      setIsOverlayVisible(false);
      console.log(' App: Results overlay hidden - showing header');
    }
  };
  

  // Cleanup OCR worker on app unmount
  useEffect(() => {
    return () => {
      OCRService.terminate();
    };
  }, []);

  // Determine if header should be hidden (only when results overlay feature is enabled AND overlay is visible)
  const shouldHideHeader = features.resultsOverlay && isOverlayVisible;
  
  return (
    <div className="min-h-screen">
      {/* Conditionally render header - only hide when results overlay experimental feature is enabled AND overlay is visible */}
      {!shouldHideHeader && <Header />}
      <main className={shouldHideHeader ? "pt-0" : "pt-36"}>
        <ComparisonInterface 
          showAdvancedOcrCard={showAdvancedOcrCard}
          showPerformanceDemoCard={showPerformanceDemoCard}
          showExtremeTestSuite={showExtremeTestSuite}
          onToggleAdvancedOcr={onToggleAdvancedOcr}
          onTogglePerformanceDemo={onTogglePerformanceDemo}
          onToggleExtremeTestSuite={onToggleExtremeTestSuite}
          onOverlayShow={handleOverlayShow}
          onOverlayHide={handleOverlayHide}
        />
      </main>
      
      
      {/* Footer - Enhanced with glassmorphism to match top sections */}
      <footer className="mt-16 glass-panel border-t border-theme-neutral-200 shadow-lg transition-all duration-300">
        <div className="footer-container">
          <div className="text-center text-theme-neutral-600">
            <p className="text-xs font-serif libertinus-math-text leading-relaxed">
              Built for legal professionals. All processing happens in your browser - your documents never leave your device.
            </p>
            <p className="text-xs mt-1 text-theme-neutral-500 font-serif libertinus-math-text leading-relaxed">
              Proprietary algorithm tuned for surgical, semantic redlines. 
              Features advanced OCR powered by Tesseract.js for screenshot-to-text conversion.
            </p>
            
            {/* Enhanced footer features with glassmorphic styling */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm"> Privacy First</h4>
                <p className="text-xs text-theme-neutral-600">
                  Client-side processing ensures complete confidentiality
                </p>
              </div>
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm"> Lightning Fast</h4>
                <p className="text-xs text-theme-neutral-600">
                  Optimized Myers algorithm for instant results
                </p>
              </div>
              <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
                <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm"> Multi-Language</h4>
                <p className="text-xs text-theme-neutral-600">
                  Advanced OCR supports 10+ languages
                </p>
              </div>
            </div>
            
            {/* Professional attribution */}
            <div className="mt-6 pt-4 border-t border-theme-neutral-200">
              <p className="text-xs text-theme-neutral-400 font-serif">
                2025 RdLn - Professional Text Redlining with OCR
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  // State for developer mode toggles with localStorage persistence
  const [showAdvancedOcrCardState, setShowAdvancedOcrCardState] = useState(() => {
    try {
      const saved = localStorage.getItem('developer-card-toggles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.showAdvancedOcrCard ?? true;
      }
    } catch (error) {
      console.warn('Failed to load developer card toggles from localStorage:', error);
    }
    return true;
  });
  
  const [showPerformanceDemoCardState, setShowPerformanceDemoCardState] = useState(() => {
    try {
      const saved = localStorage.getItem('developer-card-toggles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.showPerformanceDemoCard ?? true;
      }
    } catch (error) {
      console.warn('Failed to load developer card toggles from localStorage:', error);
    }
    return true;
  });
  
  const [showExtremeTestSuiteState, setShowExtremeTestSuiteState] = useState(() => {
    try {
      const saved = localStorage.getItem('developer-card-toggles');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.showExtremeTestSuite ?? false; // Default to false for extreme test suite
      }
    } catch (error) {
      console.warn('Failed to load developer card toggles from localStorage:', error);
    }
    return false;
  });
  
  // Save to localStorage whenever toggles change
  useEffect(() => {
    try {
      const toggles = {
        showAdvancedOcrCard: showAdvancedOcrCardState,
        showPerformanceDemoCard: showPerformanceDemoCardState,
        showExtremeTestSuite: showExtremeTestSuiteState
      };
      localStorage.setItem('developer-card-toggles', JSON.stringify(toggles));
    } catch (error) {
      console.warn('Failed to save developer card toggles to localStorage:', error);
    }
  }, [showAdvancedOcrCardState, showPerformanceDemoCardState, showExtremeTestSuiteState]);
  
  // Listen for storage events to sync changes across windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'developer-card-toggles' && event.newValue) {
        try {
          const newToggles = JSON.parse(event.newValue);
          if (newToggles.showAdvancedOcrCard !== undefined) {
            setShowAdvancedOcrCardState(newToggles.showAdvancedOcrCard);
          }
          if (newToggles.showPerformanceDemoCard !== undefined) {
            setShowPerformanceDemoCardState(newToggles.showPerformanceDemoCard);
          }
          if (newToggles.showExtremeTestSuite !== undefined) {
            setShowExtremeTestSuiteState(newToggles.showExtremeTestSuite);
          }
        } catch (error) {
          console.warn('Failed to parse developer card toggles from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Toggle functions for developer mode controls
  const handleToggleAdvancedOcr = () => {
    setShowAdvancedOcrCardState(!showAdvancedOcrCardState);
  };
  
  const handleTogglePerformanceDemo = () => {
    setShowPerformanceDemoCardState(!showPerformanceDemoCardState);
  };
  
  const handleToggleExtremeTestSuite = () => {
    setShowExtremeTestSuiteState(!showExtremeTestSuiteState);
  };
  
  const isInProduction = process.env.NODE_ENV === 'production';

  return (
    <ThemeProvider>
      <LayoutProvider>
        <ExperimentalLayoutProvider>
          <div className="App">
            {/* Conditional rendering for test pages */}
{window.location.pathname === '/logo-test' ? (
            <LogoTestPage />
          ) : window.location.pathname === '/cupping-test' ? (
            <CuppingTestPage />
          ) : window.location.pathname === '/dev-dashboard' ? (
            <DeveloperDashboard
              showAdvancedOcrCard={showAdvancedOcrCardState}
              showPerformanceDemoCard={showPerformanceDemoCardState}
              showExtremeTestSuite={showExtremeTestSuiteState}
              onToggleAdvancedOcr={handleToggleAdvancedOcr}
              onTogglePerformanceDemo={handleTogglePerformanceDemo}
              onToggleExtremeTestSuite={handleToggleExtremeTestSuite}
            />
          ) : window.location.pathname === '/boundary-test' ? (
            <BoundaryFragmentTest />
          ) : window.location.pathname === '/test-fix' ? (
            <BoundaryFixTester />
          ) : (
            <AppContent 
              showAdvancedOcrCard={showAdvancedOcrCardState}
              showPerformanceDemoCard={showPerformanceDemoCardState}
              showExtremeTestSuite={showExtremeTestSuiteState}
              onToggleAdvancedOcr={handleToggleAdvancedOcr}
              onTogglePerformanceDemo={handleTogglePerformanceDemo}
              onToggleExtremeTestSuite={handleToggleExtremeTestSuite}
            />
          )}
          </div>
        </ExperimentalLayoutProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}

export default App;
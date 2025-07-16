import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ComparisonInterface } from './components/ComparisonInterface';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ExperimentalLayoutProvider, useExperimentalFeatures } from './contexts/ExperimentalLayoutContext';
import { OCRService } from './services/OCRService';
import { LogoTestPage } from './pages/LogoTestPage';
import { CuppingTestPage } from './pages/CuppingTestPage';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import BoundaryFragmentTest from './pages/BoundaryFragmentTest';
import BoundaryFixTester from './components/BoundaryFixTester';
import { SmartPasteTest } from './components/SmartPasteTest';
import { OCRFeatureCard } from './components/OCRFeatureCard';
import { BackgroundLoadingStatus } from './components/BackgroundLoadingStatus';
import './styles/resize-overrides.css';

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
    <div className="min-h-screen flex flex-col">
      {!shouldHideHeader && <Header />}
      <main className={`flex-1 overflow-y-auto ${shouldHideHeader ? "pt-0" : "pt-36"}`}>
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

      {/* OCR Loading Card - Moved here from ComparisonInterface */}
      {showAdvancedOcrCard && <OCRFeatureCard visible={true} />}

      {/* Background Loading Status - Moved here from ComparisonInterface */}
      <BackgroundLoadingStatus enabled={true} compact={true} className="mb-4" />

      <div className="glass-panel border-t border-theme-neutral-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-theme-neutral-600">


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
            <div style={{ fontFamily: 'inherit' }}>
              2025 RdLn - Professional Text Redlining with OCR.<br />
              All rights reserved.<br /><br />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  // State for developer mode toggles with localStorage persistence
  const [showAdvancedOcrCardState, setShowAdvancedOcrCardState] = useState(false);
  const [showPerformanceDemoCardState, setShowPerformanceDemoCardState] = useState(false);
  const [showExtremeTestSuiteState, setShowExtremeTestSuiteState] = useState(false);

  // Load states from localStorage on initial render
  useEffect(() => {
    const savedAdvancedOcr = localStorage.getItem('showAdvancedOcrCard');
    if (savedAdvancedOcr) {
      setShowAdvancedOcrCardState(JSON.parse(savedAdvancedOcr));
    }

    const savedPerformanceDemo = localStorage.getItem('showPerformanceDemoCard');
    if (savedPerformanceDemo) {
      setShowPerformanceDemoCardState(JSON.parse(savedPerformanceDemo));
    }

    const savedExtremeTestSuite = localStorage.getItem('showExtremeTestSuite');
    if (savedExtremeTestSuite) {
      setShowExtremeTestSuiteState(JSON.parse(savedExtremeTestSuite));
    }
  }, []);

  // Handler toggles with localStorage persistence
  const handleToggleAdvancedOcr = () => {
    const newState = !showAdvancedOcrCardState;
    setShowAdvancedOcrCardState(newState);
    localStorage.setItem('showAdvancedOcrCard', JSON.stringify(newState));
  };

  const handleTogglePerformanceDemo = () => {
    const newState = !showPerformanceDemoCardState;
    setShowPerformanceDemoCardState(newState);
    localStorage.setItem('showPerformanceDemoCard', JSON.stringify(newState));
  };

  const handleToggleExtremeTestSuite = () => {
    const newState = !showExtremeTestSuiteState;
    setShowExtremeTestSuiteState(newState);
    localStorage.setItem('showExtremeTestSuite', JSON.stringify(newState));
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
            ) : window.location.pathname === '/smartpaste-test' ? (
              <SmartPasteTest />
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
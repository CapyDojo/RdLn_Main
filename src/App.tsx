/*
 * RdLn™ - Professional Document Comparison Tool
 * Copyright (c) 2025 RdLn Team. All rights reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is proprietary to RdLn Team and may not be copied,
 * distributed, modified, or used without express written permission.
 * 
 * For licensing information, see LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { Languages } from 'lucide-react';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { ComparisonInterface } from './components/ComparisonInterface';
import { BetaTermsDialog } from './components/BetaTermsDialog';
import { BetaAgreementDialog } from './components/BetaAgreementDialog';
import { AboutDialog } from './components/AboutDialog';
import { useTheme } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ExperimentalLayoutProvider, useExperimentalFeatures } from './contexts/ExperimentalLayoutContext';
import { ScrollLockProvider } from './contexts/ScrollLockContext';
import { OCRService } from './services/OCRService';
import { analyticsService, trackEvent } from './services/AnalyticsService';
import { LogoTestPage } from './pages/LogoTestPage';
import { CuppingTestPage } from './pages/CuppingTestPage';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { RedliningTestsDashboard } from './pages/RedliningTestsDashboard';
import { UnifiedTestDashboard } from './pages/UnifiedTestDashboard';
import BoundaryFragmentTest from './pages/BoundaryFragmentTest';
import BoundaryFixTester from './components/BoundaryFixTester';
import { SmartPasteTest } from './components/SmartPasteTest';
import { OCRFeatureCard } from './components/OCRFeatureCard';
import { BackgroundLoadingStatus } from './components/BackgroundLoadingStatus';
import { BackgroundLanguageLoader } from './services/BackgroundLanguageLoader';
import OnboardingTour, { TourRestartButton } from './components/experimental/onboarding/OnboardingTour';
import { StorageQuotaManager } from './components/StorageQuotaManager';
import DocxTestPage from './pages/DocxTestPage';
import './styles/resize-overrides.css';

interface AppContentProps {
  showAdvancedOcrCard: boolean;
  showPerformanceDemoCard: boolean;
  onToggleAdvancedOcr: () => void;
  onTogglePerformanceDemo: () => void;
}

function AppContent({
  showAdvancedOcrCard,
  showPerformanceDemoCard,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo
}: AppContentProps) {
  useTheme(); // For theme context initialization

  // Get experimental features to check if results overlay is enabled
  const { features } = useExperimentalFeatures();

  // State for overlay visibility (only used when results overlay feature is enabled)
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  // Track whether inputs currently have any content (used by onContentChange)
  const [, setHasContent] = useState(false);

  // Beta agreement state
  const [showBetaAgreement, setShowBetaAgreement] = useState(false);

  // About dialog state
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Beta terms dialog state
  const [showBetaTermsDialog, setShowBetaTermsDialog] = useState(false);

  // Onboarding tour state
  const [showTourRestart, setShowTourRestart] = useState(false);
  const [shouldStartTour, setShouldStartTour] = useState(false);

  const comparisonInterfaceRef = React.useRef<{ loadSampleData?: (original: string, revised: string, autoRun: boolean) => void }>(null);

  // Check beta agreement acceptance on mount
  useEffect(() => {
    const checkBetaAgreement = () => {
      try {
        const betaAcceptance = localStorage.getItem('rdln_beta_terms_accepted');
        if (!betaAcceptance) {
          setShowBetaAgreement(true);
        } else {
          const acceptanceData = JSON.parse(betaAcceptance);
          // Check if acceptance is for current version
          if (!acceptanceData.accepted || acceptanceData.version !== '0.5.0') {
            setShowBetaAgreement(true);
          }
        }
      } catch (error) {
        console.log('Beta agreement check error:', error);
        setShowBetaAgreement(true);
      }
    };

    checkBetaAgreement();
  }, []);

  const handleBetaAgreementAccept = () => {
    setShowBetaAgreement(false);
    // Show tour restart button after beta agreement acceptance
    setTimeout(() => setShowTourRestart(true), 2000);
  };

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

  // Sample data loading handler for demo controls - now handled by DemoBentoCard in ComparisonInterface

  // Cleanup OCR worker on app unmount
  useEffect(() => {
    return () => {
      OCRService.terminate();
    };
  }, []);

  // Setup global Tauri file drop handler once at app level
  useEffect(() => {
    const setupGlobalTauriHandler = async () => {
      try {
        // Only setup in Tauri environment
        if (typeof window !== 'undefined' && (window as unknown as { __TAURI__?: unknown }).__TAURI__) {
          const { setupGlobalTauriFileDrop } = await import('./utils/tauriFileDrop');
          await setupGlobalTauriFileDrop();
        }
      } catch (error) {
        console.log(' TAURI APP: Failed to setup global handler:', error);
      }
    };

    setupGlobalTauriHandler();

    // Cleanup on unmount
    return () => {
      try {
        const tauriCleanup = (window as unknown as { __TAURI_FILE_DROP_CLEANUP__?: () => void }).__TAURI_FILE_DROP_CLEANUP__;
        if (tauriCleanup) {
          tauriCleanup();
          (window as unknown as { __TAURI_FILE_DROP_CLEANUP__?: null }).__TAURI_FILE_DROP_CLEANUP__ = null;
        }
      } catch (error) {
        console.log(' TAURI APP: Cleanup error:', error);
      }
    };
  }, []);

  // Onboarding tour handlers
  const handleTourComplete = (tourId: string, duration: number) => {
    console.log(`✅ Tour completed: ${tourId} in ${duration}ms`);
    trackEvent.tourCompleted(duration);
    setShowTourRestart(true);
  };

  const handleTourSkip = (tourId: string, stepNumber: number) => {
    console.log(`⏭️ Tour skipped: ${tourId} at step ${stepNumber}`);
    trackEvent.tourSkipped(stepNumber);
    setShowTourRestart(true);
  };

  const handleTourStepChange = (stepNumber: number, stepId: string) => {
    console.log(`📍 Tour step: ${stepNumber + 1} - ${stepId}`);
  };

  const handleTourRestart = () => {
    // Reset tour completion status
    localStorage.removeItem('tour-rdln-welcome-tour-completed');
    localStorage.removeItem('tour-rdln-welcome-tour-skipped');
    window.location.reload(); // Simple way to restart tour
  };

  const handleStartTour = () => {
    // Track tour start
    trackEvent.tourStarted();
    
    // Reset tour completion status and start fresh
    localStorage.removeItem('tour-rdln-welcome-tour-completed');
    localStorage.removeItem('tour-rdln-welcome-tour-skipped');
    // Reset shouldStartTour first, then set to true to trigger change
    setShouldStartTour(false);
    setTimeout(() => setShouldStartTour(true), 10);
  };

  // Check if user has completed beta agreement and tour
  useEffect(() => {
    const betaAcceptance = localStorage.getItem('rdln_beta_terms_accepted');
    const tourCompleted = localStorage.getItem('tour-rdln-welcome-tour-completed');
    const tourSkipped = localStorage.getItem('tour-rdln-welcome-tour-skipped');
    
    if (betaAcceptance && (tourCompleted || tourSkipped)) {
      setShowTourRestart(true);
    }
  }, []);

  // Determine if header should be hidden (only when results overlay feature is enabled AND overlay is visible)
  const shouldHideHeader = features.resultsOverlay && isOverlayVisible;

  return (
    <div className="min-h-screen flex flex-col">
      {!shouldHideHeader && (
        <div className="flex items-start gap-4 p-4">
          {/* Header - Center */}
          <div className="flex-1">
            <Header />
          </div>
        </div>
      )}
      {!shouldHideHeader && (
        <StatusBar 
          onLoadSample={(originalText, revisedText, autoRun) => {
            if (comparisonInterfaceRef.current && comparisonInterfaceRef.current.loadSampleData) {
              comparisonInterfaceRef.current.loadSampleData(originalText, revisedText, autoRun);
            }
          }}
          isProcessing={false}
          onStartTour={handleStartTour}
        />
      )}
      <main className={`flex-1 overflow-y-auto ${shouldHideHeader ? "pt-0" : "pt-56"}`}>
        <ComparisonInterface
          ref={comparisonInterfaceRef}
          showAdvancedOcrCard={showAdvancedOcrCard}
          showPerformanceDemoCard={showPerformanceDemoCard}
          onToggleAdvancedOcr={onToggleAdvancedOcr}
          onTogglePerformanceDemo={onTogglePerformanceDemo}
          onOverlayShow={handleOverlayShow}
          onOverlayHide={handleOverlayHide}
          onContentChange={(hasText) => setHasContent(hasText)}
        />
      </main>

      {/* OCR Loading Card - Moved here from ComparisonInterface */}
      {showAdvancedOcrCard && <OCRFeatureCard visible={true} />}

      {/* Background Loading Status - render only when feature is enabled */}
      {BackgroundLanguageLoader.isEnabled() && (
        <BackgroundLoadingStatus enabled={true} compact={true} className="mb-4" />
      )}

      <div className="glass-panel border-t border-theme-neutral-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-theme-neutral-600">


          {/* Enhanced footer features with glassmorphic styling */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
              <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm">🔒 Privacy First</h4>
              <p className="text-xs text-theme-neutral-600">
                Client-side processing ensures data privacy
              </p>
            </div>
            <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
              <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm">⚡ Lightning Fast</h4>
              <p className="text-xs text-theme-neutral-600">
                Optimized redlining engine for instant results
              </p>
            </div>
            <div className="glass-panel p-4 rounded-lg border border-theme-neutral-200 subtle-button">
              <h4 className="font-semibold text-theme-primary-800 mb-2 text-sm flex items-center justify-center gap-1">
                <Languages className="w-4 h-4" />
                Multi-Language
              </h4>
              <p className="text-xs text-theme-neutral-600">
                Advanced OCR supports 10 languages
              </p>
            </div>
          </div>

          {/* Professional attribution */}
          <div className="mt-6 pt-4 border-t border-theme-neutral-200">
            <div style={{ fontFamily: 'inherit' }} className="text-center">
              © 2025 RdLn™ - Professional Text Comparison Redlining with OCR. All rights reserved.
              <div className="mt-2 flex justify-center items-center gap-4">
                <button
                  onClick={() => setShowAboutDialog(true)}
                  className="text-xs opacity-70 hover:opacity-100 hover:text-theme-accent-500 transition-all duration-200 underline"
                >
                  About
                </button>
                <span className="text-xs opacity-50">|</span>
                <button
                  onClick={() => setShowBetaTermsDialog(true)}
                  className="text-xs opacity-70 hover:opacity-100 hover:text-theme-accent-500 transition-all duration-200 underline"
                >
                  Beta Terms
                </button>
                <span className="text-xs opacity-50">|</span>
                <span className="text-xs opacity-70">Contact: <a href="mailto:kai@rdln.io" className="text-theme-accent-500 hover:text-theme-accent-400 underline transition-colors">kai@rdln.io</a></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Agreement Dialog - Show on first launch */}
      {showBetaAgreement && (
        <BetaAgreementDialog onAccept={handleBetaAgreementAccept} />
      )}

      {/* About Dialog */}
      <AboutDialog
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />

      {/* Beta Terms Dialog */}
      <BetaTermsDialog
        isOpen={showBetaTermsDialog}
        onClose={() => setShowBetaTermsDialog(false)}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isEnabled={true}
        shouldStart={shouldStartTour}
        onTourComplete={handleTourComplete}
        onTourSkip={handleTourSkip}
        onStepChange={handleTourStepChange}
        onTourStart={() => setShouldStartTour(false)}
      />

      {/* Tour Restart Button - Only show after tour completion/skip */}
      <TourRestartButton
        show={showTourRestart}
        onRestart={handleTourRestart}
      />

      {/* Storage Quota Manager - Progressive storage warning system */}
      <StorageQuotaManager />
    </div>
  );
}

function App() {

  // State for developer mode toggles with localStorage persistence
  const [showAdvancedOcrCardState, setShowAdvancedOcrCardState] = useState(false);
  const [showPerformanceDemoCardState, setShowPerformanceDemoCardState] = useState(false);

  // Initialize analytics on app start
  useEffect(() => {
    // Initialize PostHog analytics
    const POSTHOG_API_KEY = (typeof process !== 'undefined' && process.env?.REACT_APP_POSTHOG_API_KEY) || 'your-posthog-api-key';
    const POSTHOG_HOST = (typeof process !== 'undefined' && process.env?.REACT_APP_POSTHOG_HOST) || 'https://us.i.posthog.com';
    const NODE_ENV = (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'development';
    
    if (POSTHOG_API_KEY && POSTHOG_API_KEY !== 'your-posthog-api-key') {
      // Only initialize if not already initialized (handles React Strict Mode)
      if (!analyticsService.isInitialized()) {
        analyticsService.initialize({
          apiKey: POSTHOG_API_KEY,
          apiHost: POSTHOG_HOST,
          enableInDevelopment: false, // Disable tracking in development
          capturePageviews: true,
          captureClicks: false // Privacy-focused: only track explicit events
        });

        // Track initial app load with delay to ensure initialization is complete
        setTimeout(() => {
          analyticsService.track('app_loaded', {
            version: '0.5.15',
            environment: NODE_ENV
          });
        }, 100);
      }
    } else {
      // PostHog not configured - analytics disabled
      console.log('📊 Analytics: Disabled (no API key configured)');
    }

    // Set up proper shutdown handler for window close
    const handleBeforeUnload = () => {
      analyticsService.shutdown();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Don't shut down analytics on unmount in development (React Strict Mode)
    // Only shut down in production or when the window is actually closing
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (NODE_ENV === 'production') {
        analyticsService.shutdown();
      }
    };
  }, []);

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


  // const isInProduction = process.env.NODE_ENV === 'production';

  return (
    <LayoutProvider>
      <ScrollLockProvider>
        <ExperimentalLayoutProvider>
          <div className="App">
            {/* Global style override to fix background stitching issue */}
            <style>{`
              body {
                background-attachment: fixed !important;
              }
            `}</style>

            {/* Conditional rendering for test pages */}
            {window.location.pathname === '/logo-test' ? (
              <LogoTestPage />
            ) : window.location.pathname === '/cupping-test' ? (
              <CuppingTestPage />
            ) : window.location.pathname === '/dev-dashboard' ? (
              <DeveloperDashboard
                showAdvancedOcrCard={showAdvancedOcrCardState}
                showPerformanceDemoCard={showPerformanceDemoCardState}
                onToggleAdvancedOcr={handleToggleAdvancedOcr}
                onTogglePerformanceDemo={handleTogglePerformanceDemo}
              />
            ) : window.location.pathname === '/redlining-tests' ? (
              <RedliningTestsDashboard />
            ) : window.location.pathname === '/boundary-test' ? (
              <BoundaryFragmentTest />
            ) : window.location.pathname === '/test-fix' ? (
              <BoundaryFixTester />
            ) : window.location.pathname === '/smartpaste-test' ? (
              <SmartPasteTest />
            ) : window.location.pathname === '/unified-tests' ? (
              <UnifiedTestDashboard />
            ) : window.location.pathname === '/docx-test' ? (
              <DocxTestPage />
            ) : (
              <AppContent
                showAdvancedOcrCard={showAdvancedOcrCardState}
                showPerformanceDemoCard={showPerformanceDemoCardState}
                onToggleAdvancedOcr={handleToggleAdvancedOcr}
                onTogglePerformanceDemo={handleTogglePerformanceDemo}
              />
            )}
          </div>
        </ExperimentalLayoutProvider>
      </ScrollLockProvider>
    </LayoutProvider>
  );
}

export default App;
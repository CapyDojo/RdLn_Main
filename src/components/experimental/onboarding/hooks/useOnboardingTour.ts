/**
 * useOnboardingTour Hook
 * 
 * Main hook for managing onboarding tour state and functionality.
 * Provides complete tour orchestration with analytics and persistence.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TourState,
  TourConfig,
  TourStep,
  UseOnboardingTourReturn,
  UseTourNavigationReturn,
  TourAnalytics,
  TourInteraction
} from '../types/onboarding.types';

// Default tour configuration
const DEFAULT_TOUR_CONFIG: TourConfig = {
  id: 'welcome-tour',
  name: 'Welcome Tour',
  steps: [],
  showProgress: true,
  allowSkip: true,
  keyboardNavigation: true,
  overlay: true,
  overlayOpacity: 0.4,
  autoStart: false,
  persistCompletion: true
};

// Default tour state
const DEFAULT_TOUR_STATE: TourState = {
  isActive: false,
  currentStep: 0,
  totalSteps: 0,
  hasCompleted: false,
  hasSkipped: false
};

/**
 * Custom hook for tour navigation logic
 */
export const useTourNavigation = (
  tourConfig: TourConfig,
  tourState: TourState,
  setTourState: React.Dispatch<React.SetStateAction<TourState>>,
  onComplete?: () => void,
  onSkip?: () => void,
  onStepChange?: (stepNumber: number, stepId: string) => void
): UseTourNavigationReturn => {
  
  const nextStep = useCallback(() => {
    setTourState(prev => {
      const newStep = Math.min(prev.currentStep + 1, prev.totalSteps - 1);
      
      // Call step change callback
      if (onStepChange && tourConfig.steps[newStep]) {
        onStepChange(newStep, tourConfig.steps[newStep].id);
      }
      
      // Check if tour is complete
      if (newStep === prev.totalSteps - 1) {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, tourConfig.steps[newStep]?.duration || 0);
      }
      
      return { ...prev, currentStep: newStep };
    });
  }, [tourConfig.steps, onComplete, onStepChange, setTourState]);

  const previousStep = useCallback(() => {
    setTourState(prev => {
      const newStep = Math.max(prev.currentStep - 1, 0);
      
      if (onStepChange && tourConfig.steps[newStep]) {
        onStepChange(newStep, tourConfig.steps[newStep].id);
      }
      
      return { ...prev, currentStep: newStep };
    });
  }, [tourConfig.steps, onStepChange, setTourState]);

  const skipTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false,
      hasSkipped: true
    }));
    
    if (onSkip) onSkip();
    
    // Save skip status if persistence is enabled
    if (tourConfig.persistCompletion) {
      localStorage.setItem(`tour-${tourConfig.id}-skipped`, 'true');
      localStorage.setItem(`tour-${tourConfig.id}-skip-step`, tourState.currentStep.toString());
    }
  }, [tourConfig, tourState.currentStep, onSkip, setTourState]);

  const completeTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: false,
      hasCompleted: true,
      completionTime: new Date()
    }));
    
    if (onComplete) onComplete();
    
    // Save completion status if persistence is enabled
    if (tourConfig.persistCompletion) {
      localStorage.setItem(`tour-${tourConfig.id}-completed`, 'true');
      localStorage.setItem(`tour-${tourConfig.id}-completion-date`, new Date().toISOString());
    }
  }, [tourConfig, onComplete, setTourState]);

  const startTour = useCallback(() => {
    setTourState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      hasCompleted: false,
      hasSkipped: false,
      startTime: new Date()
    }));
    
    if (onStepChange && tourConfig.steps[0]) {
      onStepChange(0, tourConfig.steps[0].id);
    }
  }, [tourConfig.steps, onStepChange, setTourState]);

  const resetTour = useCallback(() => {
    setTourState(DEFAULT_TOUR_STATE);
    
    // Clear persistence data
    if (tourConfig.persistCompletion) {
      localStorage.removeItem(`tour-${tourConfig.id}-completed`);
      localStorage.removeItem(`tour-${tourConfig.id}-skipped`);
      localStorage.removeItem(`tour-${tourConfig.id}-skip-step`);
      localStorage.removeItem(`tour-${tourConfig.id}-completion-date`);
    }
  }, [tourConfig, setTourState]);

  return {
    currentStep: tourState.currentStep,
    isActive: tourState.isActive,
    canGoNext: tourState.currentStep < tourState.totalSteps - 1,
    canGoPrevious: tourState.currentStep > 0,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    startTour,
    resetTour
  };
};

/**
 * Main onboarding tour hook
 */
export const useOnboardingTour = (
  initialConfig?: Partial<TourConfig>,
  onTourComplete?: (tourId: string, duration: number) => void,
  onTourSkip?: (tourId: string, stepNumber: number) => void,
  onStepChange?: (stepNumber: number, stepId: string) => void
): UseOnboardingTourReturn => {
  
  const [tourConfig, setTourConfig] = useState<TourConfig>({
    ...DEFAULT_TOUR_CONFIG,
    ...initialConfig
  });
  
  const [tourState, setTourState] = useState<TourState>(() => ({
    ...DEFAULT_TOUR_STATE,
    totalSteps: tourConfig.steps.length
  }));

  const analyticsRef = useRef<TourAnalytics | null>(null);
  const interactionsRef = useRef<TourInteraction[]>([]);

  // Initialize analytics when tour starts
  useEffect(() => {
    if (tourState.isActive && tourState.startTime && !analyticsRef.current) {
      analyticsRef.current = {
        tourId: tourConfig.id,
        startTime: tourState.startTime,
        completedSteps: 0,
        totalSteps: tourState.totalSteps,
        completionRate: 0,
        interactions: []
      };
    }
  }, [tourState.isActive, tourState.startTime, tourConfig.id, tourState.totalSteps]);

  // Track interactions
  const trackInteraction = useCallback((
    stepId: string,
    action: TourInteraction['action'],
    duration?: number
  ) => {
    const interaction: TourInteraction = {
      stepId,
      action,
      timestamp: new Date(),
      duration
    };
    
    interactionsRef.current.push(interaction);
    
    if (analyticsRef.current) {
      analyticsRef.current.interactions = [...interactionsRef.current];
    }
  }, []);

  // Handle tour completion callback
  const handleTourComplete = useCallback(() => {
    if (tourState.startTime && onTourComplete) {
      const duration = Date.now() - tourState.startTime.getTime();
      onTourComplete(tourConfig.id, duration);
    }
    
    // Update analytics
    if (analyticsRef.current) {
      analyticsRef.current.endTime = new Date();
      analyticsRef.current.completedSteps = tourState.totalSteps;
      analyticsRef.current.completionRate = 100;
    }
    
    // Track completion interaction
    if (tourConfig.steps[tourState.currentStep]) {
      trackInteraction(tourConfig.steps[tourState.currentStep].id, 'completed');
    }
  }, [tourState.startTime, tourState.totalSteps, tourState.currentStep, tourConfig, onTourComplete, trackInteraction]);

  // Handle tour skip callback
  const handleTourSkip = useCallback(() => {
    if (onTourSkip) {
      onTourSkip(tourConfig.id, tourState.currentStep);
    }
    
    // Update analytics
    if (analyticsRef.current) {
      analyticsRef.current.endTime = new Date();
      analyticsRef.current.completedSteps = tourState.currentStep;
      analyticsRef.current.skippedAt = tourState.currentStep;
      analyticsRef.current.completionRate = (tourState.currentStep / tourState.totalSteps) * 100;
    }
    
    // Track skip interaction
    if (tourConfig.steps[tourState.currentStep]) {
      trackInteraction(tourConfig.steps[tourState.currentStep].id, 'skipped');
    }
  }, [tourState.currentStep, tourConfig, onTourSkip, trackInteraction, tourState.totalSteps]);

  // Handle step change callback
  const handleStepChange = useCallback((stepNumber: number, stepId: string) => {
    if (onStepChange) {
      onStepChange(stepNumber, stepId);
    }
    
    // Track step view
    trackInteraction(stepId, 'viewed');
  }, [onStepChange, trackInteraction]);

  // Navigation handlers
  const navigationHandlers = useTourNavigation(
    tourConfig,
    tourState,
    setTourState,
    handleTourComplete,
    handleTourSkip,
    handleStepChange
  );

  // Update tour state when config changes
  useEffect(() => {
    setTourState(prev => ({
      ...prev,
      totalSteps: tourConfig.steps.length
    }));
  }, [tourConfig.steps.length]);

  // Load completion state from localStorage on mount
  useEffect(() => {
    if (tourConfig.persistCompletion) {
      const completed = localStorage.getItem(`tour-${tourConfig.id}-completed`) === 'true';
      const skipped = localStorage.getItem(`tour-${tourConfig.id}-skipped`) === 'true';
      
      if (completed || skipped) {
        setTourState(prev => ({
          ...prev,
          hasCompleted: completed,
          hasSkipped: skipped
        }));
      }
    }
  }, [tourConfig.id, tourConfig.persistCompletion]);

  // Keyboard navigation
  useEffect(() => {
    if (!tourState.isActive || !tourConfig.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          if (navigationHandlers.canGoNext) {
            event.preventDefault();
            navigationHandlers.nextStep();
          }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (navigationHandlers.canGoPrevious) {
            event.preventDefault();
            navigationHandlers.previousStep();
          }
          break;
        case 'Escape':
          if (tourConfig.allowSkip) {
            event.preventDefault();
            navigationHandlers.skipTour();
          }
          break;
        case 'Enter':
        case ' ':
          if (navigationHandlers.canGoNext) {
            event.preventDefault();
            navigationHandlers.nextStep();
          } else {
            event.preventDefault();
            navigationHandlers.completeTour();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tourState.isActive, tourConfig.keyboardNavigation, tourConfig.allowSkip, navigationHandlers]);

  // Auto-start tour if configured
  useEffect(() => {
    if (tourConfig.autoStart && !tourState.hasCompleted && !tourState.hasSkipped) {
      const timer = setTimeout(() => {
        navigationHandlers.startTour();
      }, 1000); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [tourConfig.autoStart, tourState.hasCompleted, tourState.hasSkipped, navigationHandlers]);

  // Get current tour step
  const currentTourStep: TourStep | null = 
    tourConfig.steps[tourState.currentStep] || null;

  return {
    tourState,
    navigationHandlers,
    currentTourStep,
    tourConfig,
    setTourConfig: (config: TourConfig) => {
      setTourConfig(config);
      setTourState(prev => ({
        ...prev,
        totalSteps: config.steps.length
      }));
    }
  };
};
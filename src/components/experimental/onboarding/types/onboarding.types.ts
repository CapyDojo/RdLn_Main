/**
 * OnBoarding Tour System Types
 * 
 * Type definitions for the user onboarding tour system.
 * This system provides interactive step-by-step guidance for new users.
 */

export interface TourStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string;  // CSS selector for the element to highlight
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: TourStepAction;
  duration?: number;  // How long to show this step (milliseconds)
  allowSkip?: boolean;
  showProgress?: boolean;
}

export interface TourStepAction {
  type: 'click' | 'hover' | 'focus' | 'custom';
  element?: string;  // CSS selector
  customHandler?: () => void;
}

export interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  hasCompleted: boolean;
  hasSkipped: boolean;
  startTime?: Date;
  completionTime?: Date;
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  showProgress: boolean;
  allowSkip: boolean;
  keyboardNavigation: boolean;
  overlay: boolean;
  overlayOpacity: number;
  autoStart: boolean;
  persistCompletion: boolean;  // Save completion status to localStorage
}

export interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  position?: { x: number; y: number };
  targetElement?: HTMLElement;
}

export interface OnboardingTourProps {
  config: TourConfig;
  isEnabled: boolean;
  onTourComplete?: (tourId: string, duration: number) => void;
  onTourSkip?: (tourId: string, stepNumber: number) => void;
  onStepChange?: (stepNumber: number, stepId: string) => void;
}

export interface UseTourNavigationReturn {
  currentStep: number;
  isActive: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  startTour: () => void;
  resetTour: () => void;
}

export interface UseOnboardingTourReturn {
  tourState: TourState;
  navigationHandlers: UseTourNavigationReturn;
  currentTourStep: TourStep | null;
  tourConfig: TourConfig;
  setTourConfig: (config: TourConfig) => void;
}

// Predefined tour configurations
export type TourType = 'welcome' | 'quickstart' | 'advanced-features';

// Analytics and tracking
export interface TourAnalytics {
  tourId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  completedSteps: number;
  totalSteps: number;
  skippedAt?: number;
  completionRate: number;
  interactions: TourInteraction[];
}

export interface TourInteraction {
  stepId: string;
  action: 'viewed' | 'clicked' | 'skipped' | 'completed';
  timestamp: Date;
  duration?: number;
}
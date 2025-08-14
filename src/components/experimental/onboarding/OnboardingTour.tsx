/**
 * OnboardingTour Component
 * 
 * Main orchestrator component for the user onboarding tour system.
 * Handles tour state, element highlighting, and overlay management.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OnboardingTourProps, TourConfig } from './types/onboarding.types';
import { useOnboardingTour } from './hooks/useOnboardingTour';
import TourTooltip from './TourTooltip';
import './styles/onboarding.css';

// Predefined tour configuration for RdLn
const RDLN_WELCOME_TOUR: TourConfig = {
  id: 'rdln-welcome-tour',
  name: 'RdLn Welcome Tour',
  showProgress: true,
  allowSkip: true,
  keyboardNavigation: true,
  overlay: true,
  overlayOpacity: 0.4,
  autoStart: false,
  persistCompletion: true,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to RdLn™',
      content: 'Compare documents instantly with professional redlining. Let\'s take a quick tour to show you the key features.',
      placement: 'center',
      duration: 0,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'input-method',
      title: 'Add Your Documents',
      content: 'Type or paste text into these panels. You can also paste screenshots for OCR text extraction in 10+ languages.',
      targetElement: 'textarea[placeholder*="original text here"]',
      placement: 'bottom',
      duration: 0,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'quick-demo',
      title: 'Try It Instantly',
      content: 'Click "Quick Demo" to see RdLn in action with sample legal text. Perfect for getting started quickly.',
      targetElement: '[data-testid="quick-demo-button"]',
      placement: 'bottom',
      duration: 0,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'results-preview',
      title: 'Professional Results',
      content: 'Get beautifully formatted redlined results with additions, deletions, and professional export options (Word, HTML, DOCX).',
      targetElement: 'main',
      placement: 'top',
      duration: 0,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'memory-system',
      title: 'RdLn Memory',
      content: 'Save and organize your comparison sessions. Never lose important document comparisons again.',
      targetElement: 'filing-cabinet-button',
      placement: 'left',
      duration: 0,
      allowSkip: true,
      showProgress: true
    },
    {
      id: 'customization',
      title: 'Personalize Your Experience',
      content: 'Choose from 10+ professional themes and adjust text size for optimal readability.',
      targetElement: 'theme-selector-button',
      placement: 'bottom',
      duration: 0,
      allowSkip: true,
      showProgress: true
    }
  ]
};

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  config = RDLN_WELCOME_TOUR,
  isEnabled,
  shouldStart = false,
  onTourComplete,
  onTourSkip,
  onStepChange,
  onTourStart
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [cutoutRect, setCutoutRect] = useState<DOMRect | null>(null);
  
  const {
    tourState,
    navigationHandlers,
    currentTourStep,
    tourConfig
  } = useOnboardingTour(
    config,
    (tourId: string, duration: number) => {
      if (onTourComplete) {
        onTourComplete(tourId, duration);
      }
    },
    (tourId: string, stepNumber: number) => {
      if (onTourSkip) {
        onTourSkip(tourId, stepNumber);
      }
    },
    onStepChange
  );

  // Find target element for current step
  const findTargetElement = useCallback((selector: string): HTMLElement | null => {
    // Try multiple selector strategies
    const strategies = [
      () => document.querySelector(selector) as HTMLElement,
      () => document.querySelector(`[data-testid="${selector.replace('[data-testid="', '').replace('"]', '')}"]`) as HTMLElement,
      () => {
        // Handle special text-based selectors
        if (selector.includes('text:')) {
          const text = selector.replace('text:', '');
          const buttons = document.querySelectorAll('button');
          return Array.from(buttons).find(btn => 
            btn.textContent?.toLowerCase().includes(text.toLowerCase())
          ) as HTMLElement || null;
        }
        return null;
      },
      () => {
        // Handle memory button with filing cabinet icon
        if (selector.includes('filing-cabinet-button')) {
          const buttons = document.querySelectorAll('button');
          return Array.from(buttons).find(btn => {
            const hasText = btn.textContent?.includes('filing cabinet') || btn.textContent?.includes('Memory');
            const hasIcon = btn.querySelector('img') || btn.textContent?.includes('🗂️');
            return hasText || hasIcon;
          }) as HTMLElement || null;
        }
        return null;
      },
      () => {
        // Handle theme selector button
        if (selector.includes('theme-selector-button')) {
          const buttons = document.querySelectorAll('button');
          return Array.from(buttons).find(btn => 
            btn.getAttribute('aria-label')?.includes('Theme selector') ||
            btn.textContent?.includes('theme') ||
            btn.querySelector('img[alt*="theme"]')
          ) as HTMLElement || null;
        }
        return null;
      },
      () => {
        // Try finding by class names extracted from selector
        const classMatch = selector.match(/\.([a-zA-Z-_]+)/g);
        if (classMatch) {
          const className = classMatch[0].replace('.', '');
          return document.querySelector(`.${className}`) as HTMLElement;
        }
        return null;
      }
    ];

    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (element && element.offsetParent !== null) { // Element is visible
          return element;
        }
      } catch (error) {
        console.warn(`Target element strategy failed:`, error);
      }
    }

    console.warn(`Could not find target element for selector: ${selector}`);
    return null;
  }, []);

  // Update target element when step changes
  useEffect(() => {
    if (!tourState.isActive || !currentTourStep) {
      setTargetElement(null);
      setHighlightedElement(null);
      setCutoutRect(null);
      return;
    }

    if (currentTourStep.targetElement) {
      // Add a delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = findTargetElement(currentTourStep.targetElement!);
        setTargetElement(element);
        setHighlightedElement(element);
        
        // Calculate cutout rectangle with padding
        if (element) {
          const rect = element.getBoundingClientRect();
          const padding = 8; // 8px padding around the element
          const cutout = new DOMRect(
            rect.x - padding,
            rect.y - padding,
            rect.width + (padding * 2),
            rect.height + (padding * 2)
          );
          setCutoutRect(cutout);
          
          // Scroll element into view if found
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        } else {
          setCutoutRect(null);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      setTargetElement(null);
      setHighlightedElement(null);
      setCutoutRect(null);
    }
  }, [tourState.isActive, currentTourStep, findTargetElement]);

  // Add spotlight class to highlighted element
  useEffect(() => {
    // Remove spotlight from previous element
    const previousSpotlight = document.querySelector('.onboarding-spotlight');
    if (previousSpotlight) {
      previousSpotlight.classList.remove('onboarding-spotlight');
    }

    // Add spotlight to current element
    if (highlightedElement) {
      highlightedElement.classList.add('onboarding-spotlight');
    }

    return () => {
      // Clean up on unmount
      if (highlightedElement) {
        highlightedElement.classList.remove('onboarding-spotlight');
      }
    };
  }, [highlightedElement]);

  // Update cutout position on scroll/resize
  useEffect(() => {
    if (!tourState.isActive || !targetElement) {
      return;
    }

    const updateCutoutPosition = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const padding = 8;
        const cutout = new DOMRect(
          rect.x - padding,
          rect.y - padding,
          rect.width + (padding * 2),
          rect.height + (padding * 2)
        );
        setCutoutRect(cutout);
      }
    };

    // Update on scroll and resize
    window.addEventListener('scroll', updateCutoutPosition, { passive: true });
    window.addEventListener('resize', updateCutoutPosition);
    
    return () => {
      window.removeEventListener('scroll', updateCutoutPosition);
      window.removeEventListener('resize', updateCutoutPosition);
    };
  }, [tourState.isActive, targetElement]);

  // Handle manual tour start via shouldStart prop
  useEffect(() => {
    if (shouldStart && isEnabled && !tourState.isActive) {
      console.log('🎯 Starting tour manually via shouldStart prop (ignoring completion status)');
      // Reset tour state first to allow restart
      navigationHandlers.resetTour();
      // Small delay to ensure reset is processed
      setTimeout(() => {
        navigationHandlers.startTour();
        if (onTourStart) {
          onTourStart();
        }
      }, 10);
    }
  }, [shouldStart, isEnabled, tourState.isActive, navigationHandlers, onTourStart]);

  // Handle overlay clicks
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === overlayRef.current && tourConfig.allowSkip) {
      navigationHandlers.skipTour();
    }
  }, [navigationHandlers, tourConfig.allowSkip]);

  // Don't render if not enabled or no active tour
  if (!isEnabled || !tourState.isActive || !currentTourStep) {
    return null;
  }

  // Generate clip-path for cutout as fallback
  const generateClipPath = () => {
    if (!cutoutRect) return undefined;
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const leftPercent = (cutoutRect.x / vw) * 100;
    const topPercent = (cutoutRect.y / vh) * 100;
    const rightPercent = ((cutoutRect.x + cutoutRect.width) / vw) * 100;
    const bottomPercent = ((cutoutRect.y + cutoutRect.height) / vh) * 100;
    
    // Create a polygon that covers the full screen but excludes the cutout area
    return `polygon(0% 0%, 0% 100%, ${leftPercent}% 100%, ${leftPercent}% ${topPercent}%, ${rightPercent}% ${topPercent}%, ${rightPercent}% ${bottomPercent}%, ${leftPercent}% ${bottomPercent}%, ${leftPercent}% 100%, 100% 100%, 100% 0%)`;
  };

  return (
    <div className="onboarding-tour">
      {/* Overlay with cutout */}
      {tourConfig.overlay && (
        <>
          {/* SVG mask definition for browsers that support it */}
          <svg
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              visibility: 'hidden'
            }}
          >
            <defs>
              <mask id={`cutout-mask-${tourState.currentStep + 1}`}>
                <rect width="100%" height="100%" fill="white" />
                {cutoutRect && (
                  <rect
                    x={cutoutRect.x}
                    y={cutoutRect.y}
                    width={cutoutRect.width}
                    height={cutoutRect.height}
                    fill="black"
                    rx="8"
                    ry="8"
                  />
                )}
              </mask>
            </defs>
          </svg>
          
          <div
            ref={overlayRef}
            className={`onboarding-overlay ${tourState.isActive ? 'active' : ''}`}
            style={{
              backgroundColor: `rgba(0, 0, 0, ${tourConfig.overlayOpacity})`,
              backdropFilter: 'blur(4px)',
              // Use CSS mask first, then clip-path as fallback
              mask: cutoutRect ? `url(#cutout-mask-${tourState.currentStep + 1})` : undefined,
              WebkitMask: cutoutRect ? `url(#cutout-mask-${tourState.currentStep + 1})` : undefined,
              clipPath: cutoutRect ? generateClipPath() : undefined
            }}
            onClick={handleOverlayClick}
            aria-hidden="true"
          />
        </>
      )}

      {/* Tour Tooltip */}
      <TourTooltip
        step={currentTourStep}
        currentStep={tourState.currentStep}
        totalSteps={tourState.totalSteps}
        onNext={navigationHandlers.nextStep}
        onPrevious={navigationHandlers.previousStep}
        onSkip={navigationHandlers.skipTour}
        onComplete={navigationHandlers.completeTour}
        targetElement={targetElement}
      />
    </div>
  );
};

// Helper component for tour restart button
export const TourRestartButton: React.FC<{
  onRestart: () => void;
  show: boolean;
}> = ({ onRestart, show }) => {
  if (!show) return null;

  return (
    <button
      className={`onboarding-fab ${show ? 'visible' : ''}`}
      onClick={onRestart}
      aria-label="Restart tour"
      title="Take the tour again"
    >
      ?
    </button>
  );
};

export default OnboardingTour;
export { RDLN_WELCOME_TOUR };
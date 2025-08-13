/**
 * TourTooltip Component
 * 
 * Floating tooltip component for tour steps with positioning and animation.
 * Uses Floating UI for intelligent positioning around target elements.
 */

import React, { useEffect, useRef, useState } from 'react';
import { TourTooltipProps } from './types/onboarding.types';
import './styles/onboarding.css';

interface FloatingPosition {
  x: number;
  y: number;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  targetElement
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<FloatingPosition>({
    x: 0,
    y: 0,
    placement: 'center'
  });
  const [isVisible, setIsVisible] = useState(false);

  // Calculate optimal position based on target element
  const calculatePosition = (): FloatingPosition => {
    if (!targetElement) {
      // Center on screen if no target element
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        placement: 'center'
      };
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320; // Max width from CSS
    const tooltipHeight = 200; // Estimated height
    const margin = 16;

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Preferred placement from step config or default
    let preferredPlacement = step.placement || 'bottom';
    let x = 0;
    let y = 0;

    // Calculate position based on placement
    switch (preferredPlacement) {
      case 'top':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - margin;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + margin;
        break;
      case 'left':
        x = rect.left - tooltipWidth - margin;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        x = rect.right + margin;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
      case 'center':
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    // Boundary detection and adjustment
    if (x < margin) {
      x = margin;
      if (preferredPlacement === 'left') preferredPlacement = 'right';
    }
    if (x + tooltipWidth > viewport.width - margin) {
      x = viewport.width - tooltipWidth - margin;
      if (preferredPlacement === 'right') preferredPlacement = 'left';
    }
    if (y < margin) {
      y = margin;
      if (preferredPlacement === 'top') preferredPlacement = 'bottom';
    }
    if (y + tooltipHeight > viewport.height - margin) {
      y = viewport.height - tooltipHeight - margin;
      if (preferredPlacement === 'bottom') preferredPlacement = 'top';
    }

    return {
      x: Math.max(margin, Math.min(x, viewport.width - tooltipWidth - margin)),
      y: Math.max(margin, Math.min(y, viewport.height - tooltipHeight - margin)),
      placement: preferredPlacement as FloatingPosition['placement']
    };
  };

  // Update position when target element or step changes
  useEffect(() => {
    const updatePosition = () => {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    };

    updatePosition();

    // Update position on scroll or resize
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [targetElement, step]);

  // Show tooltip with animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle auto-progression for timed steps
  useEffect(() => {
    if (step.duration && step.duration > 0) {
      const timer = setTimeout(() => {
        if (currentStep === totalSteps - 1) {
          onComplete();
        } else {
          onNext();
        }
      }, step.duration);

      return () => clearTimeout(timer);
    }
  }, [step.duration, currentStep, totalSteps, onNext, onComplete]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step.allowSkip !== false) {
        onSkip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSkip, step.allowSkip]);

  const tooltipStyle: React.CSSProperties = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: position.placement === 'center' 
      ? 'translate(-50%, -50%)' 
      : 'none'
  };

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div
      ref={tooltipRef}
      className={`onboarding-tooltip ${isVisible ? 'visible' : ''}`}
      style={tooltipStyle}
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
    >
      <div className="onboarding-tooltip-panel">
        {/* Header */}
        <div className="onboarding-tooltip-header">
          <h3 id="tour-title" className="onboarding-tooltip-title">
            {step.title}
          </h3>
          {(step.allowSkip !== false) && (
            <button
              className="onboarding-tooltip-close"
              onClick={onSkip}
              aria-label="Skip tour"
              title="Skip tour (Esc)"
            >
              ×
            </button>
          )}
        </div>

        {/* Progress indicator */}
        {step.showProgress !== false && (
          <div className="onboarding-progress">
            <div className="onboarding-progress-dots">
              {Array.from({ length: totalSteps }, (_, index) => (
                <div
                  key={index}
                  className={`onboarding-progress-dot ${
                    index === currentStep
                      ? 'active'
                      : index < currentStep
                      ? 'completed'
                      : ''
                  }`}
                  aria-label={`Step ${index + 1} ${
                    index === currentStep
                      ? 'current'
                      : index < currentStep
                      ? 'completed'
                      : 'upcoming'
                  }`}
                />
              ))}
            </div>
            <div className="onboarding-progress-text">
              {currentStep + 1} of {totalSteps}
            </div>
          </div>
        )}

        {/* Content */}
        <div id="tour-content" className="onboarding-tooltip-content">
          {step.content}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          <div className="onboarding-nav-left">
            {!isFirstStep && (
              <button
                className="onboarding-btn onboarding-btn-secondary"
                onClick={onPrevious}
                aria-label="Previous step"
              >
                ← Previous
              </button>
            )}
          </div>

          <div className="onboarding-nav-right">
            {(step.allowSkip !== false) && !isLastStep && (
              <button
                className="onboarding-btn onboarding-btn-skip"
                onClick={onSkip}
                aria-label="Skip tour"
              >
                Skip tour
              </button>
            )}
            
            {isLastStep ? (
              <button
                className="onboarding-btn onboarding-btn-primary"
                onClick={onComplete}
                aria-label="Complete tour"
              >
                Get Started
              </button>
            ) : (
              <button
                className="onboarding-btn onboarding-btn-primary"
                onClick={onNext}
                aria-label="Next step"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourTooltip;
/**
 * TourStep Component
 * 
 * Individual tour step wrapper component.
 * Provides consistent styling and behavior for tour steps.
 */

import React from 'react';
import { TourStep as TourStepType } from './types/onboarding.types';

interface TourStepProps {
  step: TourStepType;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const TourStep: React.FC<TourStepProps> = ({
  step,
  isActive,
  isCompleted,
  onClick,
  children
}) => {
  const handleClick = () => {
    if (onClick && !isCompleted) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick && !isCompleted) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`tour-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : 'presentation'}
      tabIndex={onClick ? 0 : -1}
      aria-current={isActive ? 'step' : undefined}
      data-tour-step-id={step.id}
    >
      <div className="tour-step-header">
        <h4 className="tour-step-title">{step.title}</h4>
        {step.duration && step.duration > 0 && (
          <div className="tour-step-duration" aria-label={`Step duration: ${step.duration / 1000} seconds`}>
            {step.duration / 1000}s
          </div>
        )}
      </div>
      
      <div className="tour-step-content">
        {step.content}
      </div>
      
      {children && (
        <div className="tour-step-extra">
          {children}
        </div>
      )}
    </div>
  );
};

export default TourStep;
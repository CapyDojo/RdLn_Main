import React from 'react';
import { BaseComponentProps } from '../types/components';

// Beta countdown component
const BetaBadge: React.FC = () => {
  const BETA_EXPIRY_DATE = new Date('2025-08-31T23:59:59.999Z');
  const currentDate = new Date();
  const daysRemaining = Math.ceil((BETA_EXPIRY_DATE.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only show if beta hasn't expired
  if (currentDate > BETA_EXPIRY_DATE) {
    return null;
  }
  
  return (
    <div className="beta-badge px-3 py-1 rounded-md text-xs font-medium border text-center"
         style={{
           backdropFilter: 'blur(10px)',
           lineHeight: '1.2'
         }}>
      <span>Limited Beta v.0.5.0 ({daysRemaining} days remaining)</span>
    </div>
  );
};

export const StatusBar: React.FC<BaseComponentProps> = ({ style, className }) => {
  return (
    <div 
      className={`status-bar ${className || ''}`} 
      style={{
        position: 'fixed',
        top: '8.3rem', // Position further below the header 
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998, // Just below header's 9999
        maxWidth: '360px', // Match ComparisonInterface container
        minWidth: '320px',
        width: '95vw',
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        ...style
      }}
    >
      <div className="glass-panel rounded-lg px-4 py-2 transition-all duration-300">
        <div className="flex items-center justify-center">
          <BetaBadge />
        </div>
      </div>
    </div>
  );
};
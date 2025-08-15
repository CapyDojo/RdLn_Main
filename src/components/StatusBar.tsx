import React from 'react';
import { PlayCircle, HelpCircle } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';
import { getRecommendedSample } from '../utils/sampleData';

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

interface StatusBarProps extends BaseComponentProps {
  /** Callback when sample data should be loaded */
  onLoadSample?: (originalText: string, revisedText: string, autoRun?: boolean) => void;
  /** Whether the app is currently processing */
  isProcessing?: boolean;
  /** Callback to start the onboarding tour */
  onStartTour?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  onLoadSample, 
  isProcessing = false,
  onStartTour,
  style, 
  className 
}) => {
  const handleQuickDemo = () => {
    if (onLoadSample) {
      const sample = getRecommendedSample();
      onLoadSample(sample.originalText, sample.revisedText, true); // Auto-run comparison
    }
  };

  const handleStartTour = () => {
    if (onStartTour) {
      onStartTour();
    }
  };
  return (
    <div 
      className={`status-bar overflow-visible ${className || ''}`} 
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
      <div className="glass-panel rounded-lg px-4 py-2 transition-all duration-300 overflow-visible">
        <div className="flex items-center justify-center gap-3 overflow-visible">
          <BetaBadge />
          <div className="flex items-center gap-2">
            {onLoadSample && (
              <CustomTooltip content="Try RdLn instantly!">
                <button
                  onClick={handleQuickDemo}
                  disabled={isProcessing}
                  data-testid="quick-demo-button"
                  className="enhanced-button flex items-center gap-2 px-3 py-1.5 bg-theme-primary-600 hover:bg-theme-primary-700 text-white rounded-md text-xs font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Quick Demo</span>
                  {isProcessing && (
                    <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              </CustomTooltip>
            )}
            {onStartTour && (
              <CustomTooltip content="Learn how to use RdLn">
                <button
                  onClick={handleStartTour}
                  disabled={isProcessing}
                  data-testid="take-tour-button"
                  className="enhanced-button flex items-center gap-2 px-3 py-1.5 bg-theme-accent-600 hover:bg-theme-accent-700 text-white rounded-md text-xs font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Take Tour</span>
                </button>
              </CustomTooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
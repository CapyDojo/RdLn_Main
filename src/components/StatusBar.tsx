import React, { useEffect, useState } from 'react';
import { PlayCircle, HelpCircle } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { CustomTooltip } from './CustomTooltip';
import { getRecommendedSample } from '../utils/sampleData';
import { appConfig } from '../config/appConfig';
import { OCRWorkerPool } from '../services/OCRWorkerPool';

// Beta countdown component
const BetaBadge: React.FC = () => {
  const BETA_EXPIRY_DATE = new Date('2025-09-18T23:59:59.999Z');
  const currentDate = new Date();
  const daysRemaining = Math.ceil((BETA_EXPIRY_DATE.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Only show if beta hasn't expired
  if (currentDate > BETA_EXPIRY_DATE) {
    return null;
  }
  
  return (
    <div className="beta-badge px-3 py-1 rounded-md text-xs font-medium border text-center whitespace-nowrap"
         style={{
           backdropFilter: 'blur(10px)',
           lineHeight: '1.2'
         }}>
      <span>Limited Beta v.0.6.0 ({daysRemaining} days remaining)</span>
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
  /** Positioning mode: fixed (overlay) or static (scrolls with content) */
  position?: 'fixed' | 'static';
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  onLoadSample, 
  isProcessing = false,
  onStartTour,
  position = 'fixed',
  style, 
  className 
}) => {
  const [poolDisplay, setPoolDisplay] = useState<{ total: number; busy: number } | null>(null);

  // Lightweight pool status indicator (dev only; guarded by feature flag)
  useEffect(() => {
    if (!appConfig.features.ENABLE_MULTIWORKER_OCR) return;
    let timer: number | null = null;
    const tick = () => {
      try {
        const stats = OCRWorkerPool.getPoolStats();
        // Use the first pool (10-language) if present
        const firstKey = Object.keys(stats)[0];
        if (firstKey) {
          setPoolDisplay({ total: stats[firstKey].total, busy: stats[firstKey].busy });
        } else {
          setPoolDisplay({ total: 0, busy: 0 });
        }
      } catch {
        // ignore
      }
    };
    tick();
    timer = window.setInterval(tick, 1000) as unknown as number;
    return () => { if (timer) window.clearInterval(timer); };
  }, []);
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
  // Compute container styles based on positioning mode
  const containerStyle: React.CSSProperties = position === 'fixed'
    ? {
        position: 'fixed',
        top: '8.3rem', // Position further below the header 
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998, // Just below header's 9999
        maxWidth: '360px', // Match ComparisonInterface container
        minWidth: '320px',
        width: '95vw',
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem'
      }
    : {
        // Static mode: scrolls with content in normal flow and fits content width
        position: 'static',
        transform: 'none',
        display: 'flex',
        justifyContent: 'center',
        width: 'auto'
      };

  return (
    <div 
      className={`status-bar overflow-visible ${position === 'static' ? 'mx-auto' : ''} ${className || ''}`} 
      style={{
        ...containerStyle,
        ...style
      }}
    >
      <div className="glass-panel inline-flex rounded-lg px-4 py-2 transition-all duration-300 overflow-visible max-w-full overflow-x-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-visible whitespace-nowrap">
          <BetaBadge />
          {(appConfig.env.IS_DEVELOPMENT && appConfig.features.ENABLE_MULTIWORKER_OCR) && (
            <div className="px-3 py-1 rounded-md text-xs font-medium border text-center whitespace-nowrap"
                 style={{ backdropFilter: 'blur(10px)', lineHeight: '1.2', borderColor: 'rgba(16,185,129,0.7)' }}>
              <span>
                OCR Parallel: {poolDisplay ? `${poolDisplay.busy}/${poolDisplay.total}` : '-'}
              </span>
            </div>
          )}
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

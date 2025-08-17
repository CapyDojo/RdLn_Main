import React from 'react';
import { Zap, Image, ExternalLink, TestTube } from 'lucide-react';
import { BaseComponentProps } from '../../types/components';

interface DevelopmentToolsPanelProps extends BaseComponentProps {
  showAdvancedOcrCard?: boolean;
  showPerformanceDemoCard?: boolean;
  onToggleAdvancedOcr?: () => void;
  onTogglePerformanceDemo?: () => void;
}

export const DevelopmentToolsPanel: React.FC<DevelopmentToolsPanelProps> = ({
  showAdvancedOcrCard = true,
  showPerformanceDemoCard = true,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo,
  style,
  className
}) => {
  return (
    <div className={`space-y-4 ${className}`} style={style}>
      
      {/* Card Visibility Controls */}
      <div className="bg-theme-neutral-100 border border-theme-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <TestTube className="w-4 h-4 text-theme-primary-600" />
          <span className="text-sm font-medium text-theme-primary-800">
            Development Cards
          </span>
        </div>
        <div className="space-y-3">
          {onToggleAdvancedOcr && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-theme-neutral-800">Advanced OCR Card</div>
                <div className="text-xs text-theme-neutral-600">Show advanced OCR features and controls</div>
              </div>
              <button
                onClick={onToggleAdvancedOcr}
                className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
                  showAdvancedOcrCard 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                title="Toggle Advanced OCR card visibility"
                aria-label={`Toggle Advanced OCR card visibility ${showAdvancedOcrCard ? 'ON' : 'OFF'}`}
              >
                <Zap className="w-4 h-4" />
                <span>OCR {showAdvancedOcrCard ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
          {onTogglePerformanceDemo && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-theme-neutral-800">Performance Demo Card</div>
                <div className="text-xs text-theme-neutral-600">Show performance testing and demo controls</div>
              </div>
              <button
                onClick={onTogglePerformanceDemo}
                className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
                  showPerformanceDemoCard 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
                title="Toggle Performance Demo card visibility"
                aria-label={`Toggle Performance Demo card visibility ${showPerformanceDemoCard ? 'ON' : 'OFF'}`}
              >
                <Image className="w-4 h-4" />
                <span>Demo {showPerformanceDemoCard ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Test Pages */}
      <div className="bg-theme-neutral-100 border border-theme-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-4 h-4 text-theme-primary-600" />
          <span className="text-sm font-medium text-theme-primary-800">
            Test Pages
          </span>
        </div>
        <div className="space-y-2">
          <a 
            href="/logo-test" 
            className="block w-full px-3 py-2 bg-theme-primary-100/50 hover:bg-theme-primary-200/50 text-theme-primary-700 hover:text-theme-primary-800 text-sm font-medium rounded-lg border border-theme-primary-200/50 transition-all duration-200"
            title="View logo concept designs"
            aria-label="View logo concept designs"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <div>
                <div className="font-medium">Logo Test</div>
                <div className="text-xs opacity-75">Logo concept designs and branding tests</div>
              </div>
            </div>
          </a>
          <a 
            href="/cupping-test" 
            className="block w-full px-3 py-2 bg-theme-accent-100/50 hover:bg-theme-accent-200/50 text-theme-accent-700 hover:text-theme-accent-800 text-sm font-medium rounded-lg border border-theme-accent-200/50 transition-all duration-200"
            title="View cupping effect investigations"
            aria-label="View cupping effect investigations"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <div>
                <div className="font-medium">Cupping Test</div>
                <div className="text-xs opacity-75">Cupping effect investigations and UI tests</div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Development Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="text-sm text-purple-800">
          <div className="font-medium mb-2">🔧 Development Tools</div>
          <div className="text-xs space-y-1">
            <div>• OCR Card: Advanced optical character recognition features</div>
            <div>• Demo Card: Performance testing with mock documents</div>
            <div>• Test Pages: UI/UX concept validation and design testing</div>
            <div>• All changes apply to main app in real-time</div>
          </div>
        </div>
      </div>

    </div>
  );
};

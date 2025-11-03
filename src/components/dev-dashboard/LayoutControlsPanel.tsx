import React from 'react';
import { Layout, Monitor, Info } from 'lucide-react';
import { useLayout, LayoutMode } from '../../contexts/LayoutContext';
import { BaseComponentProps } from '../../types/components';

type LayoutControlsPanelProps = BaseComponentProps;

export const LayoutControlsPanel: React.FC<LayoutControlsPanelProps> = ({
  style,
  className
}) => {
  const { currentLayout, setLayout, supportsContainerQueries } = useLayout();

  return (
    <div className={`space-y-4 ${className}`} style={style}>
      
      {/* Current Layout Display */}
      <div className="bg-theme-neutral-100 border border-theme-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Monitor className="w-4 h-4 text-theme-primary-600" />
          <span className="text-sm font-medium text-theme-primary-800">Current Layout</span>
        </div>
        <div className="text-lg font-semibold text-theme-primary-900 capitalize">
          {currentLayout}
        </div>
        <div className="text-xs text-theme-neutral-600 mt-1">
          Using optimized layout with glassmorphism effects
        </div>
      </div>

      {/* Layout Control Button */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-theme-neutral-700 flex items-center gap-2">
          <Layout className="w-4 h-4" />
          Layout Selection
        </h4>
        
        <button
          onClick={() => setLayout('current')}
          className={`w-full px-4 py-3 text-sm rounded-lg transition-all flex items-center gap-3 bg-blue-500 text-white hover:bg-blue-600 shadow-sm`}
          title="Current production layout (max-w-7xl)"
        >
          <Monitor className="w-4 h-4" />
          <div className="flex-1 text-left">
            <div className="font-medium">Production Layout</div>
            <div className="text-xs opacity-90">Max-width container with glassmorphism</div>
          </div>
        </button>
      </div>

      {/* System Information */}
      <div className="bg-theme-neutral-50 border border-theme-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-theme-accent-600" />
          <span className="text-sm font-medium text-theme-accent-800">System Information</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-theme-neutral-600">Container Queries:</span>
            <span className={`font-medium ${supportsContainerQueries ? 'text-green-600' : 'text-red-600'}`}>
              {supportsContainerQueries ? 'Supported' : 'Not Supported'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-theme-neutral-600">Current Layout:</span>
            <span className="font-medium text-theme-primary-800 capitalize">{currentLayout}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-theme-neutral-600">Viewport:</span>
            <span className="font-medium text-theme-primary-800">
              {typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Layout Testing Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">🧪 Layout Testing</div>
          <div className="text-xs space-y-1">
            <div>• Changes apply to main app in real-time</div>
            <div>• Current layout optimized for production use</div>
            <div>• Glassmorphism effects enabled by default</div>
            <div>• Open main app in another tab to see changes</div>
          </div>
        </div>
      </div>

    </div>
  );
};

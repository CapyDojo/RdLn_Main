import React, { useState, useEffect } from 'react';
import { Settings, Activity, Beaker } from 'lucide-react';
import { BaseComponentProps } from '../types/components';
import { PerformanceDebugPanel, usePerformanceDebugPanel } from './PerformanceDebugPanel';
import { setupPerformanceDebugUtils } from '../utils/performanceDebugUtils';
import { appConfig } from '../config/appConfig';
import { useExperimentalFeatures, useHasActiveExperimentalFeatures } from '../contexts/ExperimentalLayoutContext';

type DeveloperModeCardProps = BaseComponentProps;

export const DeveloperModeCard: React.FC<DeveloperModeCardProps> = ({
  style,
  className
}) => {
  const { isVisible: isPerfDebugVisible, toggle: togglePerfDebug } = usePerformanceDebugPanel();
  const hasActiveExperimentalFeatures = useHasActiveExperimentalFeatures();
  
  // Setup performance debugging utilities on mount
  useEffect(() => {
    if (appConfig.dev.DEBUGGING.SHOW_PERFORMANCE_DEBUG) {
      setupPerformanceDebugUtils();
    }
  }, []);
  
  return (
    <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4 shadow-lg transition-all duration-300">
      <h3 className="text-lg font-semibold text-theme-primary-900 mb-2 flex items-center gap-2">
        <Settings className="w-5 h-5 text-theme-primary-900" aria-label="Developer Mode" />
        Developer Mode
      </h3>
      
{/* Layout Section - Moved to Developer Dashboard */}
      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">🔧 Layout Controls</div>
            <div className="text-xs">Layout controls moved to Developer Dashboard for better organization.</div>
            <div className="text-xs mt-1 opacity-75">Access via floating dev toggle or Ctrl+Shift+D</div>
          </div>
        </div>
      </div>
      
      {/* Performance Monitoring Section - Moved to Developer Dashboard */}
      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1 flex items-center gap-1">
              <Activity className="w-4 h-4" />
              📊 Performance Monitoring
            </div>
            <div className="text-xs">Performance controls moved to Developer Dashboard for better organization.</div>
            <div className="text-xs mt-1 opacity-75">Access via floating dev toggle or Ctrl+Shift+D</div>
          </div>
        </div>
      </div>
      
      {/* Experimental UX Features Section - Moved to Developer Dashboard */}
      <div className="mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-800">
            <div className="font-medium mb-1 flex items-center gap-1">
              <Beaker className="w-4 h-4" />
              🧪 Experimental Features
              {hasActiveExperimentalFeatures && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  ACTIVE
                </span>
              )}
            </div>
            <div className="text-xs">Feature controls moved to Developer Dashboard for better organization.</div>
            <div className="text-xs mt-1 opacity-75">Access via floating dev toggle or Ctrl+Shift+D</div>
          </div>
        </div>
      </div>
      
      {/* Development Tools Section - Moved to Developer Dashboard */}
      <div className="mb-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-sm text-purple-800">
            <div className="font-medium mb-1">🔧 Development Tools</div>
            <div className="text-xs">Now available exclusively in Developer Dashboard</div>
            <div className="text-xs mt-1 opacity-75">Access via floating dev toggle or Ctrl+Shift+D</div>
          </div>
        </div>
      </div>
      
      {/* Performance Debug Panel */}
      <PerformanceDebugPanel 
        isVisible={isPerfDebugVisible && appConfig.dev.DEBUGGING.SHOW_PERFORMANCE_DEBUG} 
        onToggle={togglePerfDebug}
      />
    </div>
  );
};

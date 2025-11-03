import React, { useState } from 'react';
import { Activity, BarChart3, RotateCcw, Download, CheckCircle, Trash2 } from 'lucide-react';
import { PerformanceDebugPanel, usePerformanceDebugPanel } from '../PerformanceDebugPanel';
import { BaseComponentProps } from '../../types/components';
import { setupPerformanceDebugUtils } from '../../utils/performanceDebugUtils';
import { appConfig } from '../../config/appConfig';

type PerformanceMonitoringPanelProps = BaseComponentProps;

export const PerformanceMonitoringPanel: React.FC<PerformanceMonitoringPanelProps> = ({
  style,
  className
}) => {
  const { isVisible: isPerfDebugVisible, toggle: togglePerfDebug } = usePerformanceDebugPanel();
  const [perfMonitoringEnabled, setPerfMonitoringEnabled] = useState(() => {
    try {
      return localStorage.getItem('performance-monitoring-enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const handleTogglePerfMonitoring = () => {
    const newValue = !perfMonitoringEnabled;
    setPerfMonitoringEnabled(newValue);
    try {
      localStorage.setItem('performance-monitoring-enabled', newValue.toString());
      if (newValue) {
        console.log('✅ Performance monitoring enabled');
      } else {
        console.log('❌ Performance monitoring disabled');
      }
    } catch (error) {
      console.warn('Failed to toggle performance monitoring:', error);
    }
  };

  // Setup performance debugging utilities on mount
  React.useEffect(() => {
    if (appConfig.dev.DEBUGGING.SHOW_PERFORMANCE_DEBUG) {
      setupPerformanceDebugUtils();
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`} style={style}>
      
      {/* Debug Controls */}
      <div className="bg-theme-neutral-100 border border-theme-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-theme-primary-600" />
          <span className="text-sm font-medium text-theme-primary-800">
            Performance Monitoring
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={handleTogglePerfMonitoring}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              perfMonitoringEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title="Toggle performance data collection"
          >
            <BarChart3 className="w-4 h-4" />
            Monitoring {perfMonitoringEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={togglePerfDebug}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              isPerfDebugVisible
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle performance debug panel visibility"
          >
            <Activity className="w-4 h-4" />
            Debug Panel {isPerfDebugVisible ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => {
              try {
                if (window.showPerfReport) {
                  window.showPerfReport(60000); // Last minute
                } else {
                  console.warn('Performance utilities not available. Enable monitoring first.');
                }
              } catch (error) {
                console.warn('Failed to show performance report:', error);
              }
            }}
            className="px-3 py-2 text-sm rounded transition-all flex items-center gap-2 bg-purple-200 text-purple-700 hover:bg-purple-300"
            title="Show performance report in console (Ctrl+Shift+R)"
          >
            <RotateCcw className="w-4 h-4" />
            Console Report
          </button>
          <button
            onClick={() => {
              try {
                if (window.showPerfMetrics) {
                  window.showPerfMetrics();
                } else {
                  console.warn('Performance utilities not available. Enable monitoring first.');
                }
              } catch (error) {
                console.warn('Failed to show performance metrics:', error);
              }
            }}
            className="px-3 py-2 text-sm rounded transition-all flex items-center gap-2 bg-indigo-200 text-indigo-700 hover:bg-indigo-300"
            title="Show current performance metrics (Ctrl+Shift+M)"
          >
            <CheckCircle className="w-4 h-4" />
            Current Metrics
          </button>
          <button
            onClick={() => {
              try {
                if (window.clearPerfData) {
                  window.clearPerfData();
                  console.log('✅ Performance data cleared');
                } else {
                  console.warn('Performance utilities not available. Enable monitoring first.');
                }
              } catch (error) {
                console.warn('Failed to clear performance data:', error);
              }
            }}
            className="px-3 py-2 text-sm rounded transition-all flex items-center gap-2 bg-red-200 text-red-700 hover:bg-red-300"
            title="Clear all performance data (Ctrl+Shift+C)"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </button>
          <button
            onClick={() => {
              try {
                if (window.exportPerfData) {
                  window.exportPerfData();
                } else {
                  console.warn('Performance utilities not available. Enable monitoring first.');
                }
              } catch (error) {
                console.warn('Failed to export performance data:', error);
              }
            }}
            className="px-3 py-2 text-sm rounded transition-all flex items-center gap-2 bg-green-200 text-green-700 hover:bg-green-300"
            title="Export performance data as JSON"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>
      
      {/* Performance Shortcuts Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">⌨️ Keyboard Shortcuts</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>📊 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+R</kbd> Report</div>
            <div>📈 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+M</kbd> Metrics</div>
            <div>🔧 <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+P</kbd> Panel</div>
            <div>🗑️ <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Shift+C</kbd> Clear</div>
          </div>
        </div>
      </div>

      {/* Performance Debug Panel */}
      <PerformanceDebugPanel
        isVisible={isPerfDebugVisible}
        onToggle={togglePerfDebug}
      />
    </div>
  );
};

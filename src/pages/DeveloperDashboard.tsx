import React from 'react';
import { Settings, ArrowLeft, Monitor, Activity, Beaker, Layout, Target } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BaseComponentProps } from '../types/components';
import { LayoutControlsPanel } from '../components/dev-dashboard/LayoutControlsPanel';
import { ExperimentalFeaturesPanel } from '../components/dev-dashboard/ExperimentalFeaturesPanel';
import { PerformanceMonitoringPanel } from '../components/dev-dashboard/PerformanceMonitoringPanel';
import { DevelopmentToolsPanel } from '../components/dev-dashboard/DevelopmentToolsPanel';
import { RedliningTestsPanel } from '../components/dev-dashboard/RedliningTestsPanel';

interface DeveloperDashboardProps extends BaseComponentProps {
  onBackToApp?: () => void;
  showAdvancedOcrCard?: boolean;
  showPerformanceDemoCard?: boolean;
  onToggleAdvancedOcr?: () => void;
  onTogglePerformanceDemo?: () => void;
  onLoadTest?: (originalText: string, revisedText: string, testName?: string) => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ 
  onBackToApp,
  showAdvancedOcrCard = true,
  showPerformanceDemoCard = true,
  onToggleAdvancedOcr,
  onTogglePerformanceDemo,
  onLoadTest,
  style, 
  className 
}) => {
  const { currentTheme } = useTheme();

  return (
    <div className={`min-h-screen bg-theme-neutral-50 ${className}`} style={style}>
      {/* Header */}
      <header className="glass-panel border-b border-theme-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-theme-primary-900" />
              <h1 className="text-2xl font-bold text-theme-primary-900">Developer Dashboard</h1>
            </div>
            <button
              onClick={onBackToApp || (() => window.history.back())}
              className="flex items-center gap-2 px-4 py-2 bg-theme-primary-100 hover:bg-theme-primary-200 text-theme-primary-800 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Feature Controls */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Layout Controls Section */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout Controls
              </h2>
              <LayoutControlsPanel />
            </div>

            {/* Experimental Features Section */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Beaker className="w-5 h-5" />
                🧪 Experimental Features
              </h2>
              <ExperimentalFeaturesPanel />
            </div>

            {/* Performance Monitoring Section */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Monitoring
              </h2>
            <PerformanceMonitoringPanel />
            </div>

            {/* Development Tools Section */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Development Tools
              </h2>
              <DevelopmentToolsPanel 
                showAdvancedOcrCard={showAdvancedOcrCard}
                showPerformanceDemoCard={showPerformanceDemoCard}
                onToggleAdvancedOcr={onToggleAdvancedOcr}
                onTogglePerformanceDemo={onTogglePerformanceDemo}
              />
            </div>

            {/* Redlining Tests Section */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Redlining Test Suite
              </h2>
              <RedliningTestsPanel onLoadTest={onLoadTest} />
            </div>

          </div>

          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            
            {/* Status Panel */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme-primary-900 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-theme-neutral-600">Current Theme:</span>
                  <span className="text-sm font-medium text-theme-primary-800">{currentTheme}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-theme-neutral-600">Environment:</span>
                  <span className="text-sm font-medium text-theme-primary-800">Development</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-theme-neutral-600">Real-time Sync:</span>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-panel border border-theme-neutral-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme-primary-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-3 py-2 text-left text-sm bg-theme-primary-100 hover:bg-theme-primary-200 text-theme-primary-800 rounded transition-all">
                  Reset All Features
                </button>
                <button className="w-full px-3 py-2 text-left text-sm bg-theme-secondary-100 hover:bg-theme-secondary-200 text-theme-secondary-800 rounded transition-all">
                  Export Settings
                </button>
                <button className="w-full px-3 py-2 text-left text-sm bg-theme-accent-100 hover:bg-theme-accent-200 text-theme-accent-800 rounded transition-all">
                  Clear Cache
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

import React from 'react';
import { Beaker, Target, ArrowUp, Smartphone, Monitor, Layers, Eye, ExternalLink, Cog, Pin, RotateCcw } from 'lucide-react';
import { useExperimentalFeatures, useHasActiveExperimentalFeatures } from '../../contexts/ExperimentalLayoutContext';
import { BaseComponentProps } from '../../types/components';

interface ExperimentalFeaturesPanelProps extends BaseComponentProps {
  // Optional props for future expansion
}

export const ExperimentalFeaturesPanel: React.FC<ExperimentalFeaturesPanelProps> = ({
  style,
  className
}) => {
  const { features, toggleFeature, resetAllFeatures, enableTestGroup } = useExperimentalFeatures();
  const hasActiveExperimentalFeatures = useHasActiveExperimentalFeatures();

  return (
    <div className={`space-y-6 ${className}`} style={style}>
      
      {/* Status Overview */}
      <div className={`border rounded-lg p-4 ${hasActiveExperimentalFeatures ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Beaker className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Feature Status</span>
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {Object.values(features).filter(f => f).length}/12 features active
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {hasActiveExperimentalFeatures ? 'Experimental features are active' : 'All features disabled'}
        </div>
      </div>

      {/* Test Group Buttons */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-theme-neutral-700">Quick Test Groups</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => enableTestGroup('visual-only')}
            className="px-3 py-2 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
            title="Enable: Results Spotlight"
          >
            <div className="font-medium">Visual Only</div>
            <div className="text-xs opacity-75">Spotlight Effects</div>
          </button>
          <button
            onClick={() => enableTestGroup('navigation-enhanced')}
            className="px-3 py-2 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200 transition-all"
            title="Enable: Results Spotlight + Jump Button + Mobile Tabs"
          >
            <div className="font-medium">Navigation Enhanced</div>
            <div className="text-xs opacity-75">Full Navigation Suite</div>
          </button>
          <button
            onClick={() => enableTestGroup('results-first')}
            className="px-3 py-2 text-sm rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
            title="Enable: Results Spotlight + Results First Animation"
          >
            <div className="font-medium">Results First</div>
            <div className="text-xs opacity-75">Animation Focus</div>
          </button>
          <button
            onClick={() => enableTestGroup('mobile-optimized')}
            className="px-3 py-2 text-sm rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all"
            title="Enable: Mobile Tabs + Results Overlay"
          >
            <div className="font-medium">Mobile Optimized</div>
            <div className="text-xs opacity-75">Mobile Experience</div>
          </button>
        </div>
        <button
          onClick={resetAllFeatures}
          className="w-full px-3 py-2 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          title="Reset all experimental features to OFF"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All Features
        </button>
      </div>

      {/* Individual Feature Toggles */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-theme-neutral-700">Individual Feature Controls</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Visual Enhancement Features */}
          <button
            onClick={() => toggleFeature('resultsSpotlight')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.resultsSpotlight
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#1: Animated entrance with gold border and contextual header"
          >
            <Target className="w-4 h-4" />
            <div>
              <div className="font-medium">#1 Spotlight</div>
              <div className="text-xs opacity-75">{features.resultsSpotlight ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          

          
          <button
            onClick={() => toggleFeature('mobileTabInterface')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.mobileTabInterface
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#6: [INPUT] [RESULTS] [BOTH] tabs for mobile"
          >
            <Smartphone className="w-4 h-4" />
            <div>
              <div className="font-medium">#6 Mobile Tabs</div>
              <div className="text-xs opacity-75">{features.mobileTabInterface ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('floatingJumpButton')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.floatingJumpButton
                ? 'bg-indigo-500 text-white hover:bg-indigo-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#7: Follows scroll, appears when results ready"
          >
            <Monitor className="w-4 h-4" />
            <div>
              <div className="font-medium">#7 Jump Button</div>
              <div className="text-xs opacity-75">{features.floatingJumpButton ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('resultsFirstAnimation')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.resultsFirstAnimation
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#9: Output replaces input position with smooth animation"
          >
            <Layers className="w-4 h-4" />
            <div>
              <div className="font-medium">#9 Results First</div>
              <div className="text-xs opacity-75">{features.resultsFirstAnimation ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('refinedResultsFirst')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.refinedResultsFirst
                ? 'bg-violet-500 text-white hover:bg-violet-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#10: 2-second overlay then animate to top position"
          >
            <Layers className="w-4 h-4" />
            <div>
              <div className="font-medium">#10 Refined First</div>
              <div className="text-xs opacity-75">{features.refinedResultsFirst ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('resultsOverlay')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.resultsOverlay
                ? 'bg-teal-500 text-white hover:bg-teal-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#8: Full-screen modal overlay for results visibility"
          >
            <Eye className="w-4 h-4" />
            <div>
              <div className="font-medium">#8 Results Overlay</div>
              <div className="text-xs opacity-75">{features.resultsOverlay ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('popoutResultsWindow')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.popoutResultsWindow
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#12: Results open in separate browser window"
          >
            <ExternalLink className="w-4 h-4" />
            <div>
              <div className="font-medium">#12 Pop-out</div>
              <div className="text-xs opacity-75">{features.popoutResultsWindow ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('userConfigurableOrder')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.userConfigurableOrder
                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#13: Save user's preferred layout order"
          >
            <Cog className="w-4 h-4" />
            <div>
              <div className="font-medium">#13 User Config</div>
              <div className="text-xs opacity-75">{features.userConfigurableOrder ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
          <button
            onClick={() => toggleFeature('stickyResultsPanel')}
            className={`px-3 py-2 text-sm rounded transition-all flex items-center gap-2 ${
              features.stickyResultsPanel
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="#16: Fixed position panel with pin/unpin and minimize controls"
          >
            <Pin className="w-4 h-4" />
            <div>
              <div className="font-medium">#16 Sticky Panel</div>
              <div className="text-xs opacity-75">{features.stickyResultsPanel ? 'ON' : 'OFF'}</div>
            </div>
          </button>
          
        </div>
      </div>

      {/* Feature Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm text-green-800">
          <div className="font-medium mb-2">🎯 Problem Addressed</div>
          <div className="text-xs space-y-1">
            <div>• "Can't find results" → Spotlight + Jump button (Auto-scroll now standard)</div>
            <div>• "Panel confusion" → Mobile tabs + Visual differentiation</div>
            <div>• "Results hard to see" → Overlay + Sticky panel + Results-first</div>
            <div>• Settings persist across sessions via localStorage</div>
          </div>
        </div>
      </div>

    </div>
  );
};

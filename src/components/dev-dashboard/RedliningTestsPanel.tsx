import React, { useState } from 'react';
import { 
  Play, 
  Zap, 
  Flame, 
  Skull, 
  FileText, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Target
} from 'lucide-react';
import { BaseComponentProps } from '../../types/components';

// Import test data
import extremeTestCases from '../../testing/data/extreme-test-cases.json';
import { ExtremeTestCase, ExtremeTestDifficulty } from '../../testing/types/extreme-test-types';

interface RedliningTestsPanelProps extends BaseComponentProps {
  onLoadTest?: (originalText: string, revisedText: string, testName?: string) => void;
}

// Define difficulty icons and colors
const difficultyConfig = {
  'Extreme': { icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  'Ultra': { icon: Flame, color: 'text-red-500', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
  'Nightmare': { icon: Skull, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-200' }
};

// Group tests by category
const groupTestsByCategory = (tests: ExtremeTestCase[]) => {
  return tests.reduce((groups, test) => {
    const category = test.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(test);
    return groups;
  }, {} as Record<string, ExtremeTestCase[]>);
};

export const RedliningTestsPanel: React.FC<RedliningTestsPanelProps> = ({
  onLoadTest,
  style,
  className
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loadingTest, setLoadingTest] = useState<string | null>(null);

  const testGroups = groupTestsByCategory(extremeTestCases as ExtremeTestCase[]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleLoadTest = async (test: ExtremeTestCase) => {
    if (!onLoadTest) return;
    
    setLoadingTest(test.id);
    try {
      // Simulate brief loading delay for UX
      await new Promise(resolve => setTimeout(resolve, 100));
      onLoadTest(test.originalText, test.revisedText, test.name);
    } finally {
      setLoadingTest(null);
    }
  };

  const getDifficultyIcon = (difficulty: ExtremeTestDifficulty) => {
    const config = difficultyConfig[difficulty];
    const IconComponent = config.icon;
    return <IconComponent className={`w-4 h-4 ${config.color}`} />;
  };

  const getDifficultyStyle = (difficulty: ExtremeTestDifficulty) => {
    return difficultyConfig[difficulty];
  };

  return (
    <div className={`space-y-4 ${className}`} style={style}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-theme-primary-100 to-theme-secondary-100 border border-theme-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-theme-primary-600" />
          <h3 className="text-lg font-semibold text-theme-primary-800">
            🎯 Redlining Test Suite
          </h3>
        </div>
        <p className="text-sm text-theme-primary-700">
          Click any test scenario below to load it into the main comparison interface. 
          These are stress tests with complex legal documents designed to validate algorithm performance.
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-theme-primary-600">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {extremeTestCases.length} test scenarios
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {Object.keys(testGroups).length} categories
          </span>
        </div>
      </div>

      {/* Test Categories */}
      <div className="space-y-3">
        {Object.entries(testGroups).map(([category, tests]) => {
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="bg-white border border-theme-neutral-200 rounded-lg overflow-hidden">
              
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 bg-theme-neutral-50 hover:bg-theme-neutral-100 border-b border-theme-neutral-200 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-theme-neutral-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-theme-neutral-600" />
                    )}
                    <span className="font-medium text-theme-neutral-800">{category}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-theme-primary-100 text-theme-primary-700 rounded-full">
                    {tests.length} test{tests.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {/* Category Tests */}
              {isExpanded && (
                <div className="divide-y divide-theme-neutral-100">
                  {tests.map((test) => {
                    const difficultyStyle = getDifficultyStyle(test.difficulty);
                    const isLoading = loadingTest === test.id;
                    
                    return (
                      <div
                        key={test.id}
                        className="p-4 hover:bg-theme-neutral-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          
                          {/* Test Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-theme-neutral-800 truncate">
                                {test.name}
                              </h4>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${difficultyStyle.bgColor} ${difficultyStyle.color} ${difficultyStyle.borderColor} border`}>
                                {getDifficultyIcon(test.difficulty)}
                                {test.difficulty}
                              </div>
                            </div>
                            
                            <p className="text-sm text-theme-neutral-600 mb-3 line-clamp-2">
                              {test.description}
                            </p>
                            
                            {/* Test Metrics */}
                            <div className="flex items-center gap-4 text-xs text-theme-neutral-500">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {test.complexity.wordCount} words
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {test.complexity.expectedChanges} changes
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {test.expectedBehavior.performanceExpectations}
                              </span>
                            </div>
                          </div>

                          {/* Load Button */}
                          <button
                            onClick={() => handleLoadTest(test)}
                            disabled={isLoading || !onLoadTest}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isLoading
                                ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed'
                                : 'bg-theme-primary-600 hover:bg-theme-primary-700 text-white shadow-sm hover:shadow-md'
                            }`}
                            title={`Load ${test.name} into comparison interface`}
                          >
                            {isLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-theme-neutral-400 border-t-transparent rounded-full animate-spin" />
                                Loading
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4" />
                                Load Test
                              </>
                            )}
                          </button>
                        </div>

                        {/* Critical Features Preview */}
                        {test.expectedBehavior.criticalFeatures.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-theme-neutral-100">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-3 h-3 text-theme-amber-600" />
                              <span className="text-xs font-medium text-theme-neutral-600">Critical Features:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {test.expectedBehavior.criticalFeatures.slice(0, 3).map((feature, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 bg-theme-amber-50 text-theme-amber-700 rounded border border-theme-amber-200"
                                >
                                  {feature}
                                </span>
                              ))}
                              {test.expectedBehavior.criticalFeatures.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-theme-neutral-100 text-theme-neutral-600 rounded">
                                  +{test.expectedBehavior.criticalFeatures.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">💡 How to Use</div>
          <div className="text-xs space-y-1">
            <div>• Click "Load Test" to inject test documents into the main comparison interface</div>
            <div>• Tests are organized by category and difficulty level</div>
            <div>• Each test includes performance expectations and critical features to validate</div>
            <div>• Use these tests to validate algorithm performance with complex legal documents</div>
          </div>
        </div>
      </div>

    </div>
  );
};
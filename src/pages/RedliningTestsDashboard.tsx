import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Target, 
  Zap, 
  Flame, 
  Skull, 
  FileText, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Play,
  ExternalLink,
  Home
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BaseComponentProps } from '../types/components';

// Import test data
import extremeTestCases from '../testing/data/extreme-test-cases.json';
import { ExtremeTestCase, ExtremeTestDifficulty } from '../testing/types/extreme-test-types';

interface RedliningTestsDashboardProps extends BaseComponentProps {
  onLoadTest?: (originalText: string, revisedText: string, testName?: string) => void;
  onBackToApp?: () => void;
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

export const RedliningTestsDashboard: React.FC<RedliningTestsDashboardProps> = ({
  onLoadTest,
  onBackToApp,
  style,
  className
}) => {
  const { currentTheme } = useTheme();
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
    setLoadingTest(test.id);
    
    try {
      // Encode test data for URL parameters
      const testData = {
        originalText: test.originalText,
        revisedText: test.revisedText,
        testName: test.name,
        testId: test.id
      };
      
      // Store in localStorage as backup
      localStorage.setItem('pendingTestLoad', JSON.stringify(testData));
      
      // Create URL with test data as parameters
      const params = new URLSearchParams({
        loadTest: 'true',
        testId: test.id,
        testName: test.name
      });
      
      // Open main app in new window/tab with test loading parameters
      const mainAppUrl = `/?${params.toString()}`;
      window.open(mainAppUrl, '_blank');
      
    } catch (error) {
      console.error('Failed to load test:', error);
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

  const getTotalStats = () => {
    const totalTests = extremeTestCases.length;
    const totalWords = extremeTestCases.reduce((sum, test) => sum + test.complexity.wordCount, 0);
    const totalChanges = extremeTestCases.reduce((sum, test) => sum + test.complexity.expectedChanges, 0);
    const avgWords = Math.round(totalWords / totalTests);
    const avgChanges = Math.round(totalChanges / totalTests);
    
    return { totalTests, totalWords, totalChanges, avgWords, avgChanges };
  };

  const stats = getTotalStats();

  return (
    <div className={`min-h-screen bg-theme-neutral-50 ${className}`} style={style}>
      
      {/* Header */}
      <header className="glass-panel border-b border-theme-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-theme-primary-900" />
              <h1 className="text-2xl font-bold text-theme-primary-900">🎯 Redlining Test Suite</h1>
              <span className="text-sm px-3 py-1 bg-theme-primary-100 text-theme-primary-700 rounded-full font-medium">
                {stats.totalTests} Tests Available
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-theme-secondary-100 hover:bg-theme-secondary-200 text-theme-secondary-800 rounded-lg transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Main App
              </a>
              <button
                onClick={onBackToApp || (() => window.history.back())}
                className="flex items-center gap-2 px-4 py-2 bg-theme-primary-100 hover:bg-theme-primary-200 text-theme-primary-800 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-theme-primary-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Total Tests</span>
            </div>
            <div className="text-2xl font-bold text-theme-primary-900">{stats.totalTests}</div>
            <div className="text-xs text-theme-neutral-500">Across {Object.keys(testGroups).length} categories</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-theme-secondary-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Total Words</span>
            </div>
            <div className="text-2xl font-bold text-theme-secondary-900">{stats.totalWords.toLocaleString()}</div>
            <div className="text-xs text-theme-neutral-500">Avg {stats.avgWords} per test</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-theme-accent-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Expected Changes</span>
            </div>
            <div className="text-2xl font-bold text-theme-accent-900">{stats.totalChanges}</div>
            <div className="text-xs text-theme-neutral-500">Avg {stats.avgChanges} per test</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-theme-neutral-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Current Theme</span>
            </div>
            <div className="text-lg font-bold text-theme-neutral-900 capitalize">{currentTheme}</div>
            <div className="text-xs text-theme-neutral-500">Active theme</div>
          </div>
        </div>

        {/* Instructions Panel */}
        <div className="glass-panel border border-blue-200 bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Redlining Tests</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Click <strong>"Load Test"</strong> on any scenario below to inject the test documents into the main comparison interface</p>
                <p>• Tests are organized by business category and difficulty level (Extreme → Ultra → Nightmare)</p>
                <p>• Each test includes complex legal documents designed to stress-test the comparison algorithm</p>
                <p>• Use these tests to validate performance, accuracy, and edge case handling</p>
                <p>• After loading a test, navigate back to the main app to see the comparison results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="space-y-4">
          {Object.entries(testGroups).map(([category, tests]) => {
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="glass-panel border border-theme-neutral-300 rounded-lg overflow-hidden">
                
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 bg-theme-neutral-50 hover:bg-theme-neutral-100 border-b border-theme-neutral-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-theme-neutral-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-theme-neutral-600" />
                      )}
                      <span className="text-lg font-semibold text-theme-neutral-800">{category}</span>
                    </div>
                    <span className="text-sm px-3 py-1 bg-theme-primary-100 text-theme-primary-700 rounded-full font-medium">
                      {tests.length} test{tests.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-theme-neutral-500">
                    Click to {isExpanded ? 'collapse' : 'expand'}
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
                          className="p-6 hover:bg-theme-neutral-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            
                            {/* Test Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="text-lg font-semibold text-theme-neutral-800">
                                  {test.name}
                                </h4>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${difficultyStyle.bgColor} ${difficultyStyle.color} ${difficultyStyle.borderColor} border`}>
                                  {getDifficultyIcon(test.difficulty)}
                                  {test.difficulty}
                                </div>
                              </div>
                              
                              <p className="text-theme-neutral-600 mb-4 leading-relaxed">
                                {test.description}
                              </p>
                              
                              {/* Test Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-sm text-theme-neutral-600">
                                  <FileText className="w-4 h-4" />
                                  <span><strong>{test.complexity.wordCount}</strong> words</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-theme-neutral-600">
                                  <Target className="w-4 h-4" />
                                  <span><strong>{test.complexity.expectedChanges}</strong> changes</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-theme-neutral-600">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>Depth <strong>{test.complexity.nestingDepth}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-theme-neutral-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{test.expectedBehavior.performanceExpectations}</span>
                                </div>
                              </div>

                              {/* Critical Features */}
                              {test.expectedBehavior.criticalFeatures.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-theme-amber-600" />
                                    <span className="text-sm font-medium text-theme-neutral-700">Critical Features:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {test.expectedBehavior.criticalFeatures.map((feature, index) => (
                                      <span
                                        key={index}
                                        className="text-xs px-2 py-1 bg-theme-amber-50 text-theme-amber-700 rounded border border-theme-amber-200"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Load Button */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleLoadTest(test)}
                                disabled={isLoading}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                                  isLoading
                                    ? 'bg-theme-neutral-100 text-theme-neutral-400 cursor-not-allowed'
                                    : 'bg-theme-primary-600 hover:bg-theme-primary-700 text-white shadow-sm hover:shadow-md'
                                }`}
                                title={`Load ${test.name} into comparison interface`}
                              >
                                {isLoading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-theme-neutral-400 border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Load Test
                                  </>
                                )}
                              </button>
                              
                              <a
                                href="/"
                                className="flex items-center gap-2 px-6 py-2 bg-theme-secondary-100 hover:bg-theme-secondary-200 text-theme-secondary-700 rounded-lg text-sm font-medium transition-all text-center justify-center"
                                title="Go to main app after loading test"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Main App
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Play, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Zap,
  Flame,
  Skull,
  Clock,
  TrendingUp,
  Filter,
  BarChart3,
  Target,
  Home,
  ArrowLeft,
  Settings,
  Activity,
  Beaker,
  Layout,
  Monitor
} from 'lucide-react';
import { MyersAlgorithm } from '../algorithms/MyersAlgorithm';
import { ComparisonResult } from '../types';
import { 
  TestCase, 
  TestResult, 
  TestSummary, 
  CategoryFilter
} from '../types/test-suite-types';
import { BaseComponentProps } from '../types/components';
import {
  loadTestCases,
  getCategories,
  filterTestCasesByCategory,
  calculateTestSummary,
  runSingleTest,
  sortTestCases,
  formatDuration,
  getStatusIcon,
  getStatusColorClass,
  searchTestCases
} from '../utils/testSuiteUtils';
import extremeTestCases from '../testing/data/extreme-test-cases.json';
import { ExtremeTestCase, ExtremeTestDifficulty } from '../testing/types/extreme-test-types';

interface UnifiedTestDashboardProps extends BaseComponentProps {
  onBackToApp?: () => void;
  onLoadTest?: (originalText: string, revisedText: string, testName?: string) => void;
}

// Define difficulty icons and colors for extreme tests
const difficultyConfig = {
  'Extreme': { icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  'Ultra': { icon: Flame, color: 'text-red-500', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
  'Nightmare': { icon: Skull, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-200' }
};

// Group tests by category
const groupTestsByCategory = (tests: TestCase[] | ExtremeTestCase[]) => {
  return tests.reduce((groups, test) => {
    const category = 'category' in test ? test.category : 'Extreme Tests';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(test);
    return groups;
  }, {} as Record<string, (TestCase | ExtremeTestCase)[]>);
};

export const UnifiedTestDashboard: React.FC<UnifiedTestDashboardProps> = ({ 
  onBackToApp,
  onLoadTest,
  style, 
  className 
}) => {
  // Load test cases and initialize state
  const standardTestCases = useMemo(() => loadTestCases(), []);
  const [activeTab, setActiveTab] = useState<'standard' | 'extreme'>('standard');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingTest, setLoadingTest] = useState<string | null>(null);
  
  // Extreme test specific state
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [extremeTestResults, setExtremeTestResults] = useState<{ [key: string]: ComparisonResult & { executionTime: number } }>({});
  const [runningExtremeTests, setRunningExtremeTests] = useState(false);
  
  // Calculate derived state for standard tests
  const categories = useMemo(() => getCategories(standardTestCases), [standardTestCases]);
  const filteredStandardTests = useMemo(() => {
    const categorized = filterTestCasesByCategory(sortTestCases(standardTestCases), selectedCategory);
    return searchTestCases(categorized, searchTerm);
  }, [standardTestCases, selectedCategory, searchTerm]);
  
  const standardSummary = useMemo(() => calculateTestSummary(testResults), [testResults]);
  
  // Calculate derived state for extreme tests
  const difficulties = ['All', 'Extreme', 'Ultra', 'Nightmare'];
  const extremeCategories = ['All', ...Array.from(new Set(extremeTestCases.map(test => test.category)))];
  
  const filteredExtremeTests = extremeTestCases.filter(test => 
    (selectedDifficulty === 'All' || test.difficulty === selectedDifficulty) &&
    (selectedCategory === 'All' || test.category === selectedCategory) &&
    (searchTerm === '' || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const extremeTestGroups = groupTestsByCategory(filteredExtremeTests);
  
  // Compare function using Myers Algorithm
  const compareFunction = useCallback((original: string, revised: string): ComparisonResult => {
    return MyersAlgorithm.compare(original, revised);
  }, []);
  
  // Run all standard tests handler
  const runAllStandardTests = useCallback(async () => {
    setRunningTests(true);
    const results: Record<string, TestResult> = {};
    
    try {
      for (const testCase of standardTestCases) {
        try {
          const result = await runSingleTest(testCase, compareFunction);
          results[testCase.id] = result;
          
          // Update results incrementally for real-time feedback
          setTestResults(prev => ({ ...prev, [testCase.id]: result }));
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Test ${testCase.id} failed:`, error);
        }
      }
    } finally {
      setRunningTests(false);
    }
  }, [standardTestCases, compareFunction]);
  
  // Run single standard test handler
  const runSingleStandardTest = useCallback(async (testCase: TestCase) => {
    try {
      const result = await runSingleTest(testCase, compareFunction);
      setTestResults(prev => ({ ...prev, [testCase.id]: result }));
    } catch (error) {
      console.error(`Test ${testCase.id} failed:`, error);
    }
  }, [compareFunction]);
  
  // Run all extreme tests handler
  const runAllExtremeTests = async () => {
    setRunningExtremeTests(true);
    const results: { [key: string]: ComparisonResult & { executionTime: number } } = {};
    
    for (const testCase of extremeTestCases) {
      try {
        const startTime = performance.now();
        const result = MyersAlgorithm.compare(testCase.originalText, testCase.revisedText);
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        results[testCase.id] = { ...result, executionTime };
        
        // Longer delay for extreme tests to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Extreme test ${testCase.id} failed:`, error);
      }
    }
    
    setExtremeTestResults(results);
    setRunningExtremeTests(false);
  };
  
  // Run single extreme test handler
  const runSingleExtremeTest = async (testCase: ExtremeTestCase) => {
    try {
      const startTime = performance.now();
      const result = MyersAlgorithm.compare(testCase.originalText, testCase.revisedText);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      setExtremeTestResults(prev => ({ 
        ...prev, 
        [testCase.id]: { ...result, executionTime }
      }));
    } catch (error) {
      console.error(`Extreme test ${testCase.id} failed:`, error);
    }
  };
  
  // Handle loading a test case
  const handleLoadTest = async (originalText: string, revisedText: string, testName?: string) => {
    if (!onLoadTest) return;
    
    setLoadingTest(testName || 'test');
    try {
      // Simulate brief loading delay for UX
      await new Promise(resolve => setTimeout(resolve, 100));
      onLoadTest(originalText, revisedText, testName);
    } finally {
      setLoadingTest(null);
    }
  };
  
  // Handle loading an extreme test case
  const handleLoadExtremeTest = async (test: ExtremeTestCase) => {
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
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  // Get test status for extreme tests
  const getExtremeTestStatus = (testId: string) => {
    const result = extremeTestResults[testId];
    if (!result) return 'pending';
    
    // More sophisticated status based on extreme complexity
    if (result.stats.totalChanges === 0) return 'warning';
    if (result.executionTime > 300) return 'slow';
    if (result.executionTime > 150) return 'medium';
    return 'passed';
  };
  
  // Get difficulty color for extreme tests
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Extreme': return 'bg-red-100 text-red-800 border-red-300';
      case 'Ultra': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Nightmare': return 'bg-black text-white border-gray-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Get status icon for extreme tests
  const getExtremeStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'slow': return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };
  
  // Get difficulty icon for extreme tests
  const getDifficultyIcon = (difficulty: ExtremeTestDifficulty) => {
    const config = difficultyConfig[difficulty];
    const IconComponent = config.icon;
    return <IconComponent className={`w-4 h-4 ${config.color}`} />;
  };
  
  // Get difficulty style for extreme tests
  const getDifficultyStyle = (difficulty: ExtremeTestDifficulty) => {
    return difficultyConfig[difficulty];
  };
  
  // Get complexity metrics for extreme tests
  const getComplexityMetrics = () => {
    const totalWords = extremeTestCases.reduce((sum, test) => sum + test.complexity.wordCount, 0);
    const avgWords = Math.round(totalWords / extremeTestCases.length);
    const totalExpectedChanges = extremeTestCases.reduce((sum, test) => sum + test.complexity.expectedChanges, 0);
    const avgChanges = Math.round(totalExpectedChanges / extremeTestCases.length);
    
    return { totalWords, avgWords, totalExpectedChanges, avgChanges };
  };
  
  const complexityMetrics = getComplexityMetrics();
  
  return (
    <div className={`min-h-screen bg-theme-neutral-50 ${className}`} style={style}>
      {/* Header */}
      <header className="glass-panel border-b border-theme-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-theme-primary-900" />
              <h1 className="text-2xl font-bold text-theme-primary-900">Unified Test Dashboard</h1>
              <span className="text-sm px-3 py-1 bg-theme-primary-100 text-theme-primary-700 rounded-full font-medium">
                {standardTestCases.length + extremeTestCases.length} Total Tests
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-theme-primary-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Standard Tests</span>
            </div>
            <div className="text-2xl font-bold text-theme-primary-900">{standardTestCases.length}</div>
            <div className="text-xs text-theme-neutral-500">Legal document tests</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-theme-secondary-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Extreme Tests</span>
            </div>
            <div className="text-2xl font-bold text-theme-secondary-900">{extremeTestCases.length}</div>
            <div className="text-xs text-theme-neutral-500">Stress tests</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-theme-accent-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Categories</span>
            </div>
            <div className="text-2xl font-bold text-theme-accent-900">
              {Array.from(new Set([...standardTestCases.map(t => t.category), ...extremeTestCases.map(t => t.category)])).length}
            </div>
            <div className="text-xs text-theme-neutral-500">Across all tests</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-theme-amber-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Avg Changes</span>
            </div>
            <div className="text-2xl font-bold text-theme-amber-900">
              {Math.round((standardSummary.averageChanges + 
                (Object.values(extremeTestResults).reduce((sum, r) => sum + r.stats.changed, 0) / Object.values(extremeTestResults).length || 0)) / 2)}
            </div>
            <div className="text-xs text-theme-neutral-500">Per test average</div>
          </div>
          
          <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-theme-neutral-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Total Results</span>
            </div>
            <div className="text-2xl font-bold text-theme-neutral-900">
              {standardSummary.totalTests + Object.keys(extremeTestResults).length}
            </div>
            <div className="text-xs text-theme-neutral-500">Tests run</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b border-theme-neutral-300">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'standard'
                ? 'text-theme-primary-600 border-b-2 border-theme-primary-600'
                : 'text-theme-neutral-500 hover:text-theme-neutral-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Standard Tests ({standardTestCases.length})
          </button>
          <button
            onClick={() => setActiveTab('extreme')}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'extreme'
                ? 'text-theme-secondary-600 border-b-2 border-theme-secondary-600'
                : 'text-theme-neutral-500 hover:text-theme-neutral-700'
            }`}
          >
            <Flame className="w-4 h-4" />
            Extreme Stress Tests ({extremeTestCases.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel border border-theme-neutral-300 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tests by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-theme-neutral-300 rounded-lg focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
                />
                <div className="absolute right-3 top-2.5 text-theme-neutral-400">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-theme-neutral-300 rounded-lg focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
              >
                {activeTab === 'standard' 
                  ? categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.name} ({category.count})
                      </option>
                    ))
                  : extremeCategories.map(category => (
                      <option key={category} value={category}>
                        {category} ({extremeTestCases.filter(t => t.category === category || category === 'All').length})
                      </option>
                    ))
                }
              </select>
            </div>
            
            {/* Difficulty Filter (Extreme Tests Only) */}
            {activeTab === 'extreme' && (
              <div className="w-full md:w-48">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-neutral-300 rounded-lg focus:ring-2 focus:ring-theme-primary-500 focus:border-theme-primary-500"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty} ({difficulty === 'All' 
                        ? extremeTestCases.length 
                        : extremeTestCases.filter(t => t.difficulty === difficulty).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Standard Tests View */}
        {activeTab === 'standard' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-theme-neutral-600">
                Showing {filteredStandardTests.length} of {standardTestCases.length} tests
              </div>
              <button
                onClick={runAllStandardTests}
                disabled={runningTests}
                className="flex items-center gap-2 px-4 py-2 bg-theme-primary-600 text-white rounded-lg hover:bg-theme-primary-700 disabled:bg-theme-neutral-400 transition-all duration-200 text-sm shadow-lg"
              >
                <Play className="w-4 h-4" />
                {runningTests ? 'Running Tests...' : 'Run All Tests'}
              </button>
            </div>
            
            {/* Preload Test Cases */}
            <div className="glass-panel border border-theme-primary-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-theme-primary-900">Large Document Test Preloaders</h4>
                <span className="text-xs bg-theme-accent-200 text-theme-accent-800 px-2 py-1 rounded-full font-medium">
                  200K CHARS
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const largeText1 = 'A'.repeat(199990) + ' Start changes' + 'A'.repeat(10);
                    const largeText1Revised = 'A'.repeat(199990) + ' Start of changes' + 'A'.repeat(10);
                    handleLoadTest(largeText1, largeText1Revised, 'Large Few Changes');
                  }}
                  className="enhanced-button flex-1 px-4 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 transition-all duration-200 shadow-lg"
                >
                  Preload Large Few Changes
                </button>
                <button
                  onClick={() => {
                    const largeText2 = 'B'.repeat(100000) + ' Original Content ' + 'B'.repeat(99995);
                    const largeText2Revised = 'Modified ' + 'B'.repeat(99995) + ' Changed Content ' + 'B'.repeat(99957) + ' Additional Modifications';
                    handleLoadTest(largeText2, largeText2Revised, 'Large Many Changes');
                  }}
                  className="enhanced-button flex-1 px-4 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 transition-all duration-200 shadow-lg"
                >
                  Preload Large Many Changes
                </button>
              </div>
              <p className="text-xs text-theme-primary-600 mt-2">
                These buttons load large documents (~200k characters) directly into the comparison interface for performance testing.
              </p>
            </div>
            
            {/* Test Cases Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStandardTests.map((testCase) => {
                const result = testResults[testCase.id];
                const isRunning = runningTests && !result;
                const isKarpathyTest = testCase.id === 'address-substitution-test';
                
                return (
                  <div 
                    key={testCase.id} 
                    className={`border rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                      isKarpathyTest 
                        ? 'border-theme-accent-300 bg-theme-accent-50' 
                        : 'border-theme-neutral-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-theme-neutral-900">{testCase.name}</h4>
                          {isKarpathyTest && (
                            <span className="text-xs bg-theme-accent-200 text-theme-accent-800 px-2 py-1 rounded-full font-medium">
                              KARPATHY TEST
                            </span>
                          )}
                          {result && (
                            <span className={`text-sm ${getStatusColorClass(result.status)}`}>
                              {getStatusIcon(result.status)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            testCase.category === 'Structured Data' 
                              ? 'bg-theme-accent-100 text-theme-accent-800' 
                              : 'bg-theme-primary-100 text-theme-primary-800'
                          }`}>
                            {testCase.category}
                          </span>
                        </div>
                        <p className="text-sm text-theme-neutral-600 mb-3">{testCase.description}</p>
                        
                        {result && (
                          <div className="text-xs text-theme-neutral-500 space-y-1">
                            <div>Changes: +{result.stats.additions} -{result.stats.deletions} ~{result.stats.changed}</div>
                            <div>Duration: {formatDuration(result.duration)}</div>
                            {result.error && (
                              <div className="text-red-600">Error: {result.error}</div>
                            )}
                          </div>
                        )}
                        
                        {isRunning && (
                          <div className="text-xs text-blue-600 flex items-center gap-1">
                            <span className="animate-spin">⏳</span>
                            Running...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadTest(testCase.originalText, testCase.revisedText, testCase.name)}
                        disabled={loadingTest === testCase.id}
                        className="enhanced-button flex-1 px-3 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 disabled:bg-theme-neutral-400 transition-all duration-200 shadow-lg"
                      >
                        {loadingTest === testCase.id ? 'Loading...' : 'Load Test Case'}
                      </button>
                      <button
                        onClick={() => runSingleStandardTest(testCase)}
                        disabled={isRunning || loadingTest === testCase.id}
                        className="enhanced-button px-3 py-2 bg-theme-neutral-600 text-white text-sm rounded hover:bg-theme-neutral-700 disabled:bg-theme-neutral-400 transition-all duration-200 shadow-lg"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Test Results Summary */}
            {standardSummary.totalTests > 0 && (
              <div className="glass-panel rounded-lg shadow-lg transition-all duration-300 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-theme-primary-600" />
                  <h4 className="font-semibold text-theme-neutral-900">Standard Test Results Summary</h4>
                  {runningTests && (
                    <span className="text-sm text-blue-600 animate-pulse">Running...</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-theme-neutral-600">Total Tests</div>
                    <div className="text-xl font-bold text-theme-primary-600">{standardSummary.totalTests}</div>
                  </div>
                  
                  <div>
                    <div className="text-theme-neutral-600">Success Rate</div>
                    <div className="text-xl font-bold text-green-600">
                      {standardSummary.totalTests > 0 ? Math.round((standardSummary.passedTests / standardSummary.totalTests) * 100) : 0}%
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-theme-neutral-600">Avg Changes</div>
                    <div className="text-xl font-bold text-theme-accent-600">{standardSummary.averageChanges}</div>
                  </div>
                  
                  <div>
                    <div className="text-theme-neutral-600">Karpathy Test</div>
                    <div className="text-xl font-bold">
                      <span className={getStatusColorClass(standardSummary.karpathyTestStatus)}>
                        {getStatusIcon(standardSummary.karpathyTestStatus)} {standardSummary.karpathyTestStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-theme-neutral-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-theme-neutral-600">Total Duration</div>
                      <div className="font-semibold text-theme-neutral-800">{formatDuration(standardSummary.totalDuration)}</div>
                    </div>
                    
                    <div>
                      <div className="text-theme-neutral-600">Failed Tests</div>
                      <div className={`font-semibold ${
                        standardSummary.failedTests > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {standardSummary.failedTests}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-theme-neutral-600">Total Substitutions</div>
                      <div className="font-semibold text-theme-accent-600">{standardSummary.totalSubstitutions}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extreme Tests View */}
        {activeTab === 'extreme' && (
          <div className="space-y-6">
            {/* Stats for Extreme Tests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Avg Words</span>
                </div>
                <div className="text-2xl font-bold text-red-900">{complexityMetrics.avgWords}</div>
                <div className="text-xs text-red-600">Per test</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-red-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Avg Changes</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">{complexityMetrics.avgChanges}</div>
                <div className="text-xs text-purple-600">Expected per test</div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">Tests Run</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(extremeTestResults).length}</div>
                <div className="text-xs text-gray-600">Of {extremeTestCases.length} total</div>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-theme-neutral-600">
                Showing {filteredExtremeTests.length} of {extremeTestCases.length} extreme tests
              </div>
              <button
                onClick={runAllExtremeTests}
                disabled={runningExtremeTests}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
              >
                <Flame className="w-4 h-4" />
                {runningExtremeTests ? 'Running Extreme Tests...' : 'Run All Extreme Tests'}
              </button>
            </div>
            
            {/* Test Categories */}
            <div className="space-y-4">
              {Object.entries(extremeTestGroups).map(([category, tests]) => {
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
                          const result = extremeTestResults[test.id];
                          const status = getExtremeTestStatus(test.id);
                          
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
                                    {result && getExtremeStatusIcon(status)}
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
                                    onClick={() => handleLoadExtremeTest(test)}
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
                                    <Home className="w-4 h-4" />
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

            {/* Extreme Test Results Summary */}
            {Object.keys(extremeTestResults).length > 0 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-red-50 via-purple-50 to-indigo-50 rounded-lg border-2 border-red-200">
                <h4 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Extreme Test Results Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="bg-white p-3 rounded border border-red-100">
                    <div className="text-red-600 font-medium">Extreme Tests</div>
                    <div className="text-2xl font-bold text-red-800">{Object.keys(extremeTestResults).length}</div>
                    <div className="text-xs text-red-500">of {extremeTestCases.length} ultra-complex</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-red-100">
                    <div className="text-red-600 font-medium">Avg Execution</div>
                    <div className="text-2xl font-bold text-red-800">
                      {Object.values(extremeTestResults).length > 0 
                        ? (Object.values(extremeTestResults).reduce((sum, r) => sum + r.executionTime, 0) / Object.values(extremeTestResults).length).toFixed(1)
                        : '0'
                      }ms
                    </div>
                    <div className="text-xs text-red-500">per extreme test</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-red-100">
                    <div className="text-red-600 font-medium">Total Changes</div>
                    <div className="text-2xl font-bold text-red-800">
                      {Object.values(extremeTestResults).reduce((sum, r) => sum + r.stats.totalChanges, 0)}
                    </div>
                    <div className="text-xs text-red-500">across all extreme tests</div>
                  </div>
                  <div className="bg-white p-3 rounded border border-red-100">
                    <div className="text-red-600 font-medium">Substitutions</div>
                    <div className="text-2xl font-bold text-red-800">
                      {Object.values(extremeTestResults).reduce((sum, r) => sum + r.stats.changed, 0)}
                    </div>
                    <div className="text-xs text-red-500">intelligent groupings</div>
                  </div>
                </div>
                
                {/* Performance Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded border border-red-100">
                    <h5 className="text-sm font-medium text-red-700 mb-2">Performance Distribution</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-green-600 font-medium">Fast (&lt;100ms):</span>
                        <span>{Object.values(extremeTestResults).filter(r => r.executionTime < 100).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600 font-medium">Medium (100-200ms):</span>
                        <span>{Object.values(extremeTestResults).filter(r => r.executionTime >= 100 && r.executionTime < 200).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600 font-medium">Slow (200-300ms):</span>
                        <span>{Object.values(extremeTestResults).filter(r => r.executionTime >= 200 && r.executionTime < 300).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600 font-medium">Very Slow (&gt;300ms):</span>
                        <span>{Object.values(extremeTestResults).filter(r => r.executionTime >= 300).length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded border border-red-100">
                    <h5 className="text-sm font-medium text-red-700 mb-2">Complexity Handling</h5>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total Words Processed:</span>
                        <span className="font-medium">{Object.keys(extremeTestResults).reduce((sum, id) => {
                          const test = extremeTestCases.find(t => t.id === id);
                          return sum + (test ? test.complexity.wordCount : 0);
                        }, 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Changes per Test:</span>
                        <span className="font-medium">
                          {Object.values(extremeTestResults).length > 0 
                            ? (Object.values(extremeTestResults).reduce((sum, r) => sum + r.stats.totalChanges, 0) / Object.values(extremeTestResults).length).toFixed(1)
                            : '0'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Execution Time:</span>
                        <span className="font-medium">
                          {Object.values(extremeTestResults).length > 0 
                            ? Math.max(...Object.values(extremeTestResults).map(r => r.executionTime)).toFixed(1)
                            : '0'
                          }ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
/**
 * Test Suite Component
 * 
 * Provides a comprehensive test interface for validating text comparison algorithms
 * with a variety of legal document scenarios and contract modifications.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Play, ChevronDown, ChevronRight, FileText, CheckCircle, XCircle, Filter, BarChart3 } from 'lucide-react';
import { MyersAlgorithm } from '../algorithms/MyersAlgorithm';
import { ComparisonResult } from '../types';
import { 
  TestCase, 
  TestResult, 
  TestSummary, 
  CategoryFilter,
  TestSuiteProps 
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
  getStatusColorClass
} from '../utils/testSuiteUtils';

export const TestSuite: React.FC<TestSuiteProps & BaseComponentProps> = ({ 
  onLoadTest, 
  onTestComplete, 
  style, 
  className 
}) => {
  // Load test cases and initialize state
  const testCases = useMemo(() => loadTestCases(), []);
  const [isExpanded, setIsExpanded] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Calculate derived state
  const categories = useMemo(() => getCategories(testCases), [testCases]);
  const filteredTests = useMemo(() => 
    filterTestCasesByCategory(sortTestCases(testCases), selectedCategory), 
    [testCases, selectedCategory]
  );
  const summary = useMemo(() => calculateTestSummary(testResults), [testResults]);
  
  // Compare function using Myers Algorithm
  const compareFunction = useCallback((original: string, revised: string): ComparisonResult => {
    return MyersAlgorithm.compare(original, revised);
  }, []);
  
  // Run all tests handler
  const runAllTests = useCallback(async () => {
    setRunningTests(true);
    const results: Record<string, TestResult> = {};
    
    try {
      for (const testCase of testCases) {
        try {
          const result = await runSingleTest(testCase, compareFunction);
          results[testCase.id] = result;
          
          // Update results incrementally for real-time feedback
          setTestResults(prev => ({ ...prev, [testCase.id]: result }));
          
          // Notify completion if callback provided
          if (onTestComplete) {
            onTestComplete(result);
          }
          
          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Test ${testCase.id} failed:`, error);
        }
      }
    } finally {
      setRunningTests(false);
    }
  }, [testCases, compareFunction, onTestComplete]);
  
  // Run single test handler
  const runSingleTestHandler = useCallback(async (testCase: TestCase) => {
    try {
      const result = await runSingleTest(testCase, compareFunction);
      setTestResults(prev => ({ ...prev, [testCase.id]: result }));
      
      if (onTestComplete) {
        onTestComplete(result);
      }
    } catch (error) {
      console.error(`Test ${testCase.id} failed:`, error);
    }
  }, [compareFunction, onTestComplete]);
  
  return (
    <div className={`glass-panel border border-theme-neutral-300 rounded-lg overflow-hidden mb-6 shadow-lg transition-all duration-300 ${className || ''}`} style={style}>
      <div 
        className="bg-theme-primary-50 border-b border-theme-primary-200 p-4 cursor-pointer hover:bg-theme-primary-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-theme-primary-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-theme-primary-600" />
            )}
            <FileText className="w-5 h-5 text-theme-primary-600" />
            <div>
              <h3 className="text-lg font-semibold text-theme-primary-900">Legal Document Test Suite</h3>
              <p className="text-sm text-theme-primary-700">
                {testCases.length} comprehensive test cases including Karpathy-inspired address substitution tests
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {summary.totalTests > 0 && (
              <div className="text-sm text-theme-primary-700">
                {summary.totalTests}/{testCases.length} tests completed
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                runAllTests();
              }}
              disabled={runningTests}
              className="enhanced-button flex items-center gap-2 px-4 py-2 bg-theme-primary-600 text-white rounded-lg hover:bg-theme-primary-700 disabled:bg-theme-neutral-400 transition-all duration-200 text-sm shadow-lg"
            >
              <Play className="w-4 h-4" />
              {runningTests ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-theme-neutral-600" />
              <span className="text-sm font-medium text-theme-neutral-700">Filter by Category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`subtle-button px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-theme-primary-600 text-white shadow-lg'
                      : 'bg-theme-neutral-100 text-theme-neutral-700 hover:bg-theme-neutral-200'
                  }`}
                >
                  {category.name}
                  <span className="ml-1 text-xs opacity-75">
                    ({category.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Cases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preload Test Cases */}
            <div className="col-span-full mb-4 p-4 bg-theme-primary-50 rounded-lg border border-theme-primary-200">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-semibold text-theme-primary-900">Large Document Test Preloaders</h4>
                <span className="text-xs bg-theme-accent-200 text-theme-accent-800 px-2 py-1 rounded-full font-medium">
                  200K CHARS
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const largeText1 = 'A'.repeat(199990) + ' Start changes' + 'A'.repeat(10);
                    const largeText1Revised = 'A'.repeat(199990) + ' Start of changes' + 'A'.repeat(10);
                    onLoadTest(largeText1, largeText1Revised);
                  }}
                  className="enhanced-button px-4 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 transition-all duration-200 shadow-lg"
                >
                  Preload Large Few Changes
                </button>
                <button
                  onClick={() => {
                    const largeText2 = 'B'.repeat(100000) + ' Original Content ' + 'B'.repeat(99995);
                    const largeText2Revised = 'Modified ' + 'B'.repeat(99995) + ' Changed Content ' + 'B'.repeat(99957) + ' Additional Modifications';
                    onLoadTest(largeText2, largeText2Revised);
                  }}
                  className="enhanced-button px-4 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 transition-all duration-200 shadow-lg"
                >
                  Preload Large Many Changes
                </button>
              </div>
              <p className="text-xs text-theme-primary-600 mt-2">
                These buttons load large documents (~200k characters) directly into the comparison interface for performance testing.
              </p>
            </div>
            {filteredTests.map((testCase) => {
              const result = testResults[testCase.id];
              const isRunning = runningTests && !result;
              
              return (
                <TestCaseCard
                  key={testCase.id}
                  testCase={testCase}
                  result={result}
                  isRunning={isRunning}
                  onLoad={onLoadTest}
                  onRun={runSingleTestHandler}
                />
              );
            })}
          </div>

          {/* Test Summary */}
          {summary.totalTests > 0 && (
            <TestResultsPanel
              results={testResults}
              summary={summary}
              isRunning={runningTests}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Test Case Card Component
const TestCaseCard: React.FC<{ 
  testCase: TestCase;
  result?: TestResult;
  isRunning: boolean;
  onLoad: (original: string, revised: string) => void;
  onRun: (testCase: TestCase) => void;
}> = ({ testCase, result, isRunning, onLoad, onRun }) => {
  const isKarpathyTest = testCase.id === 'address-substitution-test';
  
  return (
    <div className={`border rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
      isKarpathyTest ? 'border-theme-accent-300 bg-theme-accent-50' : 'border-theme-neutral-200'
    }`}>
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
          onClick={() => onLoad(testCase.originalText, testCase.revisedText)}
          className="enhanced-button flex-1 px-3 py-2 bg-theme-primary-600 text-white text-sm rounded hover:bg-theme-primary-700 transition-all duration-200 shadow-lg"
        >
          Load Test Case
        </button>
        <button
          onClick={() => onRun(testCase)}
          disabled={isRunning}
          className="enhanced-button px-3 py-2 bg-theme-neutral-600 text-white text-sm rounded hover:bg-theme-neutral-700 disabled:bg-theme-neutral-400 transition-all duration-200 shadow-lg"
        >
          Test
        </button>
      </div>
    </div>
  );
};

// Test Results Panel Component
const TestResultsPanel: React.FC<{
  results: Record<string, TestResult>;
  summary: TestSummary;
  isRunning: boolean;
}> = ({ results, summary, isRunning }) => {
  return (
    <div className="mt-6 p-4 glass-panel rounded-lg shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-theme-primary-600" />
        <h4 className="font-semibold text-theme-neutral-900">Test Results Summary</h4>
        {isRunning && (
          <span className="text-sm text-blue-600 animate-pulse">Running...</span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-theme-neutral-600">Total Tests</div>
          <div className="text-xl font-bold text-theme-primary-600">{summary.totalTests}</div>
        </div>
        
        <div>
          <div className="text-theme-neutral-600">Success Rate</div>
          <div className="text-xl font-bold text-green-600">
            {summary.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0}%
          </div>
        </div>
        
        <div>
          <div className="text-theme-neutral-600">Avg Changes</div>
          <div className="text-xl font-bold text-theme-accent-600">{summary.averageChanges}</div>
        </div>
        
        <div>
          <div className="text-theme-neutral-600">Karpathy Test</div>
          <div className="text-xl font-bold">
            <span className={getStatusColorClass(summary.karpathyTestStatus)}>
              {getStatusIcon(summary.karpathyTestStatus)} {summary.karpathyTestStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-theme-neutral-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-theme-neutral-600">Total Duration</div>
            <div className="font-semibold text-theme-neutral-800">{formatDuration(summary.totalDuration)}</div>
          </div>
          
          <div>
            <div className="text-theme-neutral-600">Failed Tests</div>
            <div className={`font-semibold ${
              summary.failedTests > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {summary.failedTests}
            </div>
          </div>
          
          <div>
            <div className="text-theme-neutral-600">Total Substitutions</div>
            <div className="font-semibold text-theme-accent-600">{summary.totalSubstitutions}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Test Suite Utilities
 * 
 * Utility functions for test case management, filtering, validation,
 * and statistical calculations for the test suite component.
 */

import { TestCase, TestResult, TestSummary, CategoryFilter, TestValidationResult } from '../types/test-suite-types';
import { ComparisonResult } from '../types';
import testCasesData from '../data/test-cases.json';

/**
 * Loads all test cases from the data file
 */
export function loadTestCases(): TestCase[] {
  return testCasesData as TestCase[];
}

/**
 * Gets unique categories from test cases with counts
 */
export function getCategories(testCases: TestCase[]): CategoryFilter[] {
  const categoryMap = new Map<string, number>();
  
  // Count tests per category
  testCases.forEach(testCase => {
    const count = categoryMap.get(testCase.category) || 0;
    categoryMap.set(testCase.category, count + 1);
  });
  
  // Create category filters
  const categories: CategoryFilter[] = [
    {
      name: 'All',
      count: testCases.length,
      selected: false
    }
  ];
  
  Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, count]) => {
      categories.push({
        name,
        count,
        selected: false
      });
    });
  
  return categories;
}

/**
 * Filters test cases by category
 */
export function filterTestCasesByCategory(testCases: TestCase[], category: string): TestCase[] {
  if (category === 'All') {
    return testCases;
  }
  return testCases.filter(testCase => testCase.category === category);
}

/**
 * Validates a test result against expected outcomes
 */
export function validateTestResult(testCase: TestCase, result: ComparisonResult): TestValidationResult {
  if (!testCase.expectedChanges) {
    return {
      passed: true,
      message: 'No validation criteria specified - test completed successfully'
    };
  }
  
  const { expectedChanges } = testCase;
  const actualAdditions = result.stats.additions;
  const actualDeletions = result.stats.deletions;
  
  const additionsMatch = actualAdditions === expectedChanges.additions;
  const deletionsMatch = actualDeletions === expectedChanges.deletions;
  
  if (additionsMatch && deletionsMatch) {
    return {
      passed: true,
      message: `Test passed: Found expected ${expectedChanges.additions} additions and ${expectedChanges.deletions} deletions`
    };
  }
  
  return {
    passed: false,
    message: `Test failed: Expected ${expectedChanges.additions} additions and ${expectedChanges.deletions} deletions, but found ${actualAdditions} additions and ${actualDeletions} deletions`,
    details: {
      expected: {
        additions: expectedChanges.additions,
        deletions: expectedChanges.deletions
      },
      actual: {
        additions: actualAdditions,
        deletions: actualDeletions
      },
      difference: `Additions: ${actualAdditions - expectedChanges.additions}, Deletions: ${actualDeletions - expectedChanges.deletions}`
    }
  };
}

/**
 * Calculates summary statistics from test results
 */
export function calculateTestSummary(results: Record<string, TestResult>): TestSummary {
  const resultValues = Object.values(results);
  const passedTests = resultValues.filter(r => r.status === 'passed').length;
  const failedTests = resultValues.filter(r => r.status === 'failed').length;
  
  const totalChanges = resultValues.reduce((sum, r) => sum + r.stats.totalChanges, 0);
  const averageChanges = resultValues.length > 0 ? Math.round(totalChanges / resultValues.length) : 0;
  
  const totalSubstitutions = resultValues.reduce((sum, r) => sum + r.stats.changed, 0);
  const totalDuration = resultValues.reduce((sum, r) => sum + r.duration, 0);
  
  // Check Karpathy test status
  const karpathyTest = results['address-substitution-test'];
  let karpathyTestStatus: 'passed' | 'failed' | 'pending' = 'pending';
  
  if (karpathyTest) {
    karpathyTestStatus = karpathyTest.status === 'passed' ? 'passed' : 'failed';
  }
  
  return {
    totalTests: resultValues.length,
    passedTests,
    failedTests,
    averageChanges,
    totalSubstitutions,
    totalDuration,
    karpathyTestStatus
  };
}

/**
 * Formats duration in milliseconds to a human-readable string
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Formats test case category for display
 */
export function formatCategory(category: string): string {
  return category.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Gets status icon for test result
 */
export function getStatusIcon(status: 'passed' | 'failed' | 'running' | 'pending'): string {
  switch (status) {
    case 'passed':
      return 'âœ…';
    case 'failed':
      return 'âŒ';
    case 'running':
      return 'â³';
    case 'pending':
    default:
      return 'â¸ï¸';
  }
}

/**
 * Gets status color class for test result
 */
export function getStatusColorClass(status: 'passed' | 'failed' | 'running' | 'pending'): string {
  switch (status) {
    case 'passed':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    case 'running':
      return 'text-blue-600';
    case 'pending':
    default:
      return 'text-gray-500';
  }
}

/**
 * Creates a test result from a comparison result
 */
export function createTestResult(
  testId: string,
  comparisonResult: ComparisonResult,
  duration: number,
  validationResult: TestValidationResult
): TestResult {
  return {
    ...comparisonResult,
    testId,
    timestamp: Date.now(),
    duration,
    status: validationResult.passed ? 'passed' : 'failed',
    error: validationResult.passed ? undefined : validationResult.message
  };
}

/**
 * Runs a single test case and returns the result
 */
export async function runSingleTest(
  testCase: TestCase,
  compareFunction: (original: string, revised: string) => ComparisonResult
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Run the comparison
    const comparisonResult = compareFunction(testCase.originalText, testCase.revisedText);
    
    // Validate the result
    const validationResult = validateTestResult(testCase, comparisonResult);
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Create and return test result
    return createTestResult(testCase.id, comparisonResult, duration, validationResult);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const failedResult: TestResult = {
      testId: testCase.id,
      timestamp: Date.now(),
      duration,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stats: {
        totalChanges: 0,
        additions: 0,
        deletions: 0,
        changed: 0,
        unchanged: 0
      },
      changes: []
    };
    
    return failedResult;
  }
}

/**
 * Sorts test cases by category and name
 */
export function sortTestCases(testCases: TestCase[]): TestCase[] {
  return [...testCases].sort((a, b) => {
    // First sort by category
    const categoryComparison = a.category.localeCompare(b.category);
    if (categoryComparison !== 0) {
      return categoryComparison;
    }
    
    // Then sort by name within category
    return a.name.localeCompare(b.name);
  });
}

/**
 * Searches test cases by name or description
 */
export function searchTestCases(testCases: TestCase[], searchTerm: string): TestCase[] {
  if (!searchTerm.trim()) {
    return testCases;
  }
  
  const lowercaseTerm = searchTerm.toLowerCase();
  
  return testCases.filter(testCase => 
    testCase.name.toLowerCase().includes(lowercaseTerm) ||
    testCase.description.toLowerCase().includes(lowercaseTerm) ||
    testCase.category.toLowerCase().includes(lowercaseTerm)
  );
}

/**
 * Generates a summary report as markdown
 */
export function generateSummaryReport(summary: TestSummary, results: Record<string, TestResult>): string {
  const timestamp = new Date().toLocaleString();
  
  let report = `# Test Suite Summary Report\n`;
  report += `Generated: ${timestamp}\n\n`;
  
  report += `## Overview\n`;
  report += `- **Total Tests:** ${summary.totalTests}\n`;
  report += `- **Passed:** ${summary.passedTests}\n`;
  report += `- **Failed:** ${summary.failedTests}\n`;
  report += `- **Success Rate:** ${summary.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0}%\n`;
  report += `- **Total Duration:** ${formatDuration(summary.totalDuration)}\n\n`;
  
  report += `## Statistics\n`;
  report += `- **Average Changes:** ${summary.averageChanges}\n`;
  report += `- **Total Substitutions:** ${summary.totalSubstitutions}\n`;
  report += `- **Karpathy Test:** ${getStatusIcon(summary.karpathyTestStatus)} ${summary.karpathyTestStatus.toUpperCase()}\n\n`;
  
  if (summary.failedTests > 0) {
    report += `## Failed Tests\n`;
    Object.values(results)
      .filter(r => r.status === 'failed')
      .forEach(result => {
        report += `- **${result.testId}:** ${result.error || 'Unknown error'}\n`;
      });
    report += '\n';
  }
  
  return report;
}

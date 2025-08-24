/**
 * Type definitions for the Extreme Test Suite.
 * Defines the structure of complex test cases used for stress testing the comparison algorithm.
 */

/**
 * Difficulty levels for extreme test cases.
 * Represents the complexity and computational intensity of the test.
 */
export type ExtremeTestDifficulty = 'Extreme' | 'Ultra' | 'Nightmare';

/**
 * Complexity metrics for test cases.
 * Provides quantitative measures of document complexity.
 */
export interface TestComplexity {
  /** Total number of words in the document */
  wordCount: number;
  
  /** Number of sentences in the document */
  sentenceCount: number;
  
  /** Expected number of changes to be detected */
  expectedChanges: number;
  
  /** Maximum nesting depth of document structure */
  nestingDepth: number;
}

/**
 * Expected behavior definition for test cases.
 * Describes what the test should validate and how it should perform.
 */
export interface ExpectedBehavior {
  /** General description of what the test validates */
  description: string;
  
  /** Critical features that must be correctly handled */
  criticalFeatures: string[];
  
  /** Performance expectations for execution time */
  performanceExpectations: string;
  
  /** Edge cases that the test specifically covers */
  edgeCases: string[];
}

/**
 * Complete extreme test case definition.
 * Represents a single complex test scenario for the comparison algorithm.
 */
export interface ExtremeTestCase {
  /** Unique identifier for the test case */
  id: string;
  
  /** Human-readable name for the test */
  name: string;
  
  /** Detailed description of what the test covers */
  description: string;
  
  /** Category or domain of the test (e.g., "M&A Transactions", "Financial Derivatives") */
  category: string;
  
  /** Difficulty level indicating computational complexity */
  difficulty: ExtremeTestDifficulty;
  
  /** Quantitative complexity metrics */
  complexity: TestComplexity;
  
  /** Original document text for comparison */
  originalText: string;
  
  /** Revised document text for comparison */
  revisedText: string;
  
  /** Expected behavior and validation criteria */
  expectedBehavior: ExpectedBehavior;
  
  /** Specific aspects that make this a stress test */
  stressTestAspects: string[];
}

/**
 * Test execution result for an extreme test case.
 * Contains the actual results and performance metrics from running a test.
 */
export interface ExtremeTestResult {
  /** Unique identifier matching the test case */
  testId: string;
  
  /** Whether the test passed all validations */
  success: boolean;
  
  /** Time taken to execute the test in milliseconds */
  executionTime: number;
  
  /** Statistical results from the comparison */
  stats: {
    /** Number of additions detected */
    additions: number;
    
    /** Number of deletions detected */
    deletions: number;
    
    /** Number of unchanged segments */
    unchanged: number;
    
    /** Number of changed/modified segments */
    changed: number;
    
    /** Total number of changes (additions + deletions + changed) */
    totalChanges: number;
  };
  
  /** Any error message if the test failed */
  error?: string;
  
  /** Additional validation results */
  validationResults?: {
    /** Whether all critical features were correctly handled */
    criticalFeaturesHandled: boolean;
    
    /** Whether performance expectations were met */
    performanceMet: boolean;
    
    /** Whether edge cases were properly processed */
    edgeCasesHandled: boolean;
  };
}

/**
 * Collection of test results indexed by test ID.
 * Used to store and manage results from multiple test executions.
 */
export type ExtremeTestResultsMap = Record<string, ExtremeTestResult>;

/**
 * Configuration options for running extreme tests.
 * Allows customization of test execution behavior.
 */
export interface ExtremeTestConfig {
  /** Maximum execution time allowed per test in milliseconds */
  timeoutMs?: number;
  
  /** Whether to run tests in parallel or sequentially */
  parallel?: boolean;
  
  /** Whether to include detailed validation checks */
  detailedValidation?: boolean;
  
  /** Specific test IDs to run (if empty, runs all tests) */
  testFilter?: string[];
}

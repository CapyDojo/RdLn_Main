/**
 * ListValidator - Compares extracted text with expected output
 * Calculates accuracy metrics for list numbering reproduction
 */

import type { AccuracyMetrics, Diff } from './types';

export class ListValidator {
  /**
   * Calculate accuracy by comparing extracted text with expected text
   * @param testCase - Name of the test case
   * @param expected - Expected text (from Word copy-paste)
   * @param actual - Actual extracted text from our parser
   * @returns Accuracy metrics with detailed differences
   */
  calculateAccuracy(
    testCase: string,
    expected: string,
    actual: string
  ): AccuracyMetrics {
    const expectedLines = this.normalizeText(expected).split('\n');
    const actualLines = this.normalizeText(actual).split('\n');

    const differences: Diff[] = [];
    let matchedLines = 0;

    const maxLines = Math.max(expectedLines.length, actualLines.length);

    for (let i = 0; i < maxLines; i++) {
      const expectedLine = expectedLines[i] || '';
      const actualLine = actualLines[i] || '';

      if (expectedLine === actualLine) {
        matchedLines++;
      } else {
        if (i >= expectedLines.length) {
          // Extra line in actual
          differences.push({
            lineNumber: i + 1,
            expected: '',
            actual: actualLine,
            type: 'extra',
          });
        } else if (i >= actualLines.length) {
          // Missing line in actual
          differences.push({
            lineNumber: i + 1,
            expected: expectedLine,
            actual: '',
            type: 'missing',
          });
        } else {
          // Mismatch
          differences.push({
            lineNumber: i + 1,
            expected: expectedLine,
            actual: actualLine,
            type: 'mismatch',
          });
        }
      }
    }

    const totalLines = maxLines;
    const accuracy = totalLines > 0 ? (matchedLines / totalLines) * 100 : 0;

    return {
      testCase,
      expectedLines,
      actualLines,
      matchedLines,
      totalLines,
      accuracy,
      differences,
    };
  }

  /**
   * Normalize text for comparison
   * - Trim whitespace from each line
   * - Remove completely empty lines at start and end
   * - Normalize line endings
   */
  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim() // Remove leading/trailing whitespace
      .split('\n')
      .map(line => line.trimEnd()) // Trim trailing space from each line
      .join('\n');
  }

  /**
   * Generate a human-readable accuracy report
   * @param metrics - Accuracy metrics to format
   * @returns Formatted report string
   */
  generateReport(metrics: AccuracyMetrics): string {
    const report: string[] = [];

    report.push(`\n=== Accuracy Report: ${metrics.testCase} ===\n`);
    report.push(`Accuracy: ${metrics.accuracy.toFixed(2)}%`);
    report.push(`Matched Lines: ${metrics.matchedLines}/${metrics.totalLines}`);

    if (metrics.differences.length > 0) {
      report.push(`\nDifferences Found: ${metrics.differences.length}\n`);

      metrics.differences.forEach((diff, index) => {
        if (index < 10) { // Show first 10 differences only
          report.push(`\n[Line ${diff.lineNumber}] ${diff.type.toUpperCase()}`);
          if (diff.expected) {
            report.push(`  Expected: "${diff.expected}"`);
          }
          if (diff.actual) {
            report.push(`  Actual:   "${diff.actual}"`);
          }
        }
      });

      if (metrics.differences.length > 10) {
        report.push(`\n... and ${metrics.differences.length - 10} more differences`);
      }
    } else {
      report.push('\n✓ Perfect match! No differences found.');
    }

    report.push('\n');

    return report.join('\n');
  }

  /**
   * Determine if test passed based on target accuracy
   * @param metrics - Accuracy metrics
   * @param targetAccuracy - Target accuracy percentage (0-100)
   * @returns true if test passed
   */
  testPassed(metrics: AccuracyMetrics, targetAccuracy: number): boolean {
    return metrics.accuracy >= targetAccuracy;
  }
}

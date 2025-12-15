/**
 * AccuracyReport - Display accuracy metrics and differences
 */

import type { AccuracyMetrics } from '../core/types';

interface AccuracyReportProps {
  metrics: AccuracyMetrics;
}

export function AccuracyReport({ metrics }: AccuracyReportProps) {
  const passed = metrics.accuracy >= 95;
  const statusIcon = passed ? '✅' : metrics.accuracy >= 80 ? '⚠️' : '❌';
  const statusClass = passed ? 'passed' : metrics.accuracy >= 80 ? 'warning' : 'failed';

  return (
    <div className={`accuracy-report ${statusClass}`}>
      <h2>{statusIcon} Accuracy Report</h2>

      <div className="metrics-summary">
        <div className="metric-card">
          <div className="metric-value">{metrics.accuracy.toFixed(2)}%</div>
          <div className="metric-label">Accuracy</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{metrics.matchedLines}</div>
          <div className="metric-label">Matched Lines</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{metrics.totalLines}</div>
          <div className="metric-label">Total Lines</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{metrics.differences.length}</div>
          <div className="metric-label">Differences</div>
        </div>
      </div>

      {metrics.differences.length > 0 && (
        <div className="differences-section">
          <h3>Differences Found</h3>
          <div className="differences-list">
            {metrics.differences.slice(0, 10).map((diff, index) => (
              <div key={index} className={`diff-item diff-${diff.type}`}>
                <div className="diff-header">
                  <span className="diff-line">Line {diff.lineNumber}</span>
                  <span className="diff-type">{diff.type}</span>
                </div>
                {diff.expected && (
                  <div className="diff-text expected">
                    <strong>Expected:</strong> <code>{diff.expected}</code>
                  </div>
                )}
                {diff.actual && (
                  <div className="diff-text actual">
                    <strong>Actual:</strong> <code>{diff.actual}</code>
                  </div>
                )}
              </div>
            ))}
            {metrics.differences.length > 10 && (
              <p className="more-diffs">
                ... and {metrics.differences.length - 10} more differences
              </p>
            )}
          </div>
        </div>
      )}

      {metrics.differences.length === 0 && (
        <div className="perfect-match">
          <h3>🎉 Perfect Match!</h3>
          <p>No differences found. The extraction is 100% accurate.</p>
        </div>
      )}

      <div className="status-message">
        {passed ? (
          <p className="success">✓ Test PASSED: Accuracy ≥ 95%</p>
        ) : metrics.accuracy >= 80 ? (
          <p className="warning">⚠ Partial Success: Accuracy between 80-95%</p>
        ) : (
          <p className="error">✗ Test FAILED: Accuracy &lt; 80%</p>
        )}
      </div>
    </div>
  );
}

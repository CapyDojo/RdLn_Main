/**
 * Performance Dashboard Component
 * 
 * Shows real-time OCR performance metrics and optimization effectiveness
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/PerformanceMonitor';

interface PerformanceStats {
  smartDetection: { average: number; count: number };
  traditionalDetection: { average: number; count: number };
  improvement: number;
  fallbackRate: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check if we're in development mode
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsEnabled(isDev);

    if (isDev) {
      // Update stats every 5 seconds
      const interval = setInterval(() => {
        const currentStats = performanceMonitor.getAveragePerformance();
        setStats(currentStats);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  const exportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setStats(null);
  };

  if (!isEnabled) {
    return null; // Don't show in production
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          marginBottom: '10px',
          fontSize: '12px'
        }}
      >
        📊 Performance {isVisible ? '▼' : '▲'}
      </button>

      {/* Dashboard Panel */}
      {isVisible && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          minWidth: '300px',
          backdropFilter: 'blur(10px)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>
            🚀 OCR Performance Monitor
          </h4>

          {stats && (stats.smartDetection.count > 0 || stats.traditionalDetection.count > 0) ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Smart Detection:</strong> {stats.smartDetection.average}ms 
                <span style={{ color: '#888' }}> ({stats.smartDetection.count} tests)</span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Traditional Detection:</strong> {stats.traditionalDetection.average}ms 
                <span style={{ color: '#888' }}> ({stats.traditionalDetection.count} tests)</span>
              </div>

              {stats.improvement > 0 && (
                <div style={{ marginBottom: '8px', color: '#4CAF50' }}>
                  <strong>⚡ Improvement:</strong> {stats.improvement}%
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <strong>Fallback Rate:</strong> {stats.fallbackRate}%
                {stats.fallbackRate > 20 && (
                  <span style={{ color: '#FF9800' }}> ⚠️ High</span>
                )}
              </div>

              <div style={{ 
                borderTop: '1px solid #444', 
                paddingTop: '8px', 
                marginTop: '10px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={exportMetrics}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  📤 Export
                </button>
                <button
                  onClick={clearMetrics}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#888' }}>
              No performance data yet.<br />
              Run some OCR tests to see metrics.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
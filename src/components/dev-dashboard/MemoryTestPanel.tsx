import React, { useState, useRef } from 'react';
import { useComparison } from '../../hooks/useComparison';

/**
 * Memory cleanup verification panel
 * Tests memory usage before/after cancellation to verify optimal garbage collection
 */
export const MemoryTestPanel: React.FC = () => {
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [testRunning, setTestRunning] = useState(false);
  const statsRef = useRef<any[]>([]);
  
  const {
    compareDocuments,
    cancelComparison,
    isProcessing,
    isCancelling,
    setOriginalText,
    setRevisedText
  } = useComparison();

  // Generate massive text for memory testing
  const generateMassiveText = (variant: 'original' | 'revised', size: number = 100) => {
    let text = '';
    const baseText = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ';
    
    for (let i = 0; i < size; i++) {
      text += `Section ${i}: ${baseText} ${variant} version ${i}. Reference: REF-${i}-${variant.toUpperCase()}-${Math.random().toString(36).substring(7)}. Status: ${variant === 'original' ? 'ACTIVE' : 'MODIFIED'}.\n\n`;
    }
    return text;
  };

  const getMemoryStats = () => {
    const memory = (performance as any)?.memory;
    if (!memory) return null;
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };
  };

  const formatMemory = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const runMemoryTest = async () => {
    console.log('🧪 MEMORY TEST: Starting comprehensive memory cleanup verification');
    setTestRunning(true);
    statsRef.current = [];
    
    try {
      // Step 1: Baseline memory
      const baseline = getMemoryStats();
      if (!baseline) {
        alert('Memory API not available. Please test in Chrome with --enable-precise-memory-info flag.');
        return;
      }
      
      statsRef.current.push({ phase: 'baseline', ...baseline });
      console.log('📊 MEMORY: Baseline', formatMemory(baseline.usedJSHeapSize));
      
      // Step 2: Create massive texts
      const hugeOriginal = generateMassiveText('original', 200); // ~200k chars
      const hugeRevised = generateMassiveText('revised', 200);   // ~200k chars
      
      setOriginalText(hugeOriginal);
      setRevisedText(hugeRevised);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const afterTexts = getMemoryStats();
      statsRef.current.push({ phase: 'after_texts', ...afterTexts });
      console.log('📊 MEMORY: After setting huge texts', formatMemory(afterTexts!.usedJSHeapSize));
      
      // Step 3: Start comparison (will run for several seconds)
      console.log('🚀 MEMORY: Starting comparison...');
      const comparisonPromise = compareDocuments(false, false, hugeOriginal, hugeRevised);
      
      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 1000));
      const duringProcessing = getMemoryStats();
      statsRef.current.push({ phase: 'during_processing', ...duringProcessing });
      console.log('📊 MEMORY: During processing', formatMemory(duringProcessing!.usedJSHeapSize));
      
      // Step 4: Cancel after processing has started
      console.log('🚫 MEMORY: Cancelling comparison...');
      cancelComparison();
      
      // Wait for cancellation to complete
      try {
        await comparisonPromise;
      } catch (error) {
        console.log('✅ MEMORY: Comparison cancelled as expected');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const afterCancel = getMemoryStats();
      statsRef.current.push({ phase: 'after_cancel', ...afterCancel });
      console.log('📊 MEMORY: Immediately after cancel', formatMemory(afterCancel!.usedJSHeapSize));
      
      // Step 5: Force garbage collection if available
      if ((window as any).gc) {
        console.log('🗑️ MEMORY: Forcing garbage collection...');
        (window as any).gc();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('⚠️ MEMORY: Manual GC not available, waiting for automatic GC...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const afterGC = getMemoryStats();
      statsRef.current.push({ phase: 'after_gc', ...afterGC });
      console.log('📊 MEMORY: After garbage collection', formatMemory(afterGC!.usedJSHeapSize));
      
      // Step 6: Clear texts to test full cleanup
      setOriginalText('');
      setRevisedText('');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      const afterClear = getMemoryStats();
      statsRef.current.push({ phase: 'after_clear', ...afterClear });
      console.log('📊 MEMORY: After clearing texts', formatMemory(afterClear!.usedJSHeapSize));
      
      // Calculate memory efficiency
      const memoryGrowth = afterCancel!.usedJSHeapSize - baseline.usedJSHeapSize;
      const memoryRecovered = afterCancel!.usedJSHeapSize - afterGC!.usedJSHeapSize;
      const recoveryPercentage = memoryGrowth > 0 ? (memoryRecovered / memoryGrowth) * 100 : 0;
      const isOptimal = recoveryPercentage > 80; // Good if >80% memory recovered
      
      const results = {
        stats: [...statsRef.current],
        summary: {
          baselineMemory: formatMemory(baseline.usedJSHeapSize),
          peakMemory: formatMemory(duringProcessing!.usedJSHeapSize),
          afterCancelMemory: formatMemory(afterCancel!.usedJSHeapSize),
          finalMemory: formatMemory(afterGC!.usedJSHeapSize),
          memoryGrowth: formatMemory(memoryGrowth),
          memoryRecovered: formatMemory(memoryRecovered),
          recoveryPercentage: recoveryPercentage.toFixed(1) + '%',
          isOptimal
        }
      };
      
      setMemoryStats(results);
      console.log('📊 MEMORY TEST COMPLETE:', results.summary);
      
    } catch (error) {
      console.error('❌ MEMORY TEST FAILED:', error);
    } finally {
      setTestRunning(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 80) return 'text-green-600';
    if (percentage > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        🧪 Memory Cleanup Verification
      </h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 Memory Test Process:</h4>
          <ol className="text-sm text-blue-700 space-y-1 ml-4">
            <li>1. <strong>Baseline</strong>: Measure initial memory usage</li>
            <li>2. <strong>Load Data</strong>: Create massive text inputs (~400k chars)</li>
            <li>3. <strong>Start Processing</strong>: Begin Myers algorithm comparison</li>
            <li>4. <strong>Cancel</strong>: Abort processing after it starts</li>
            <li>5. <strong>Garbage Collect</strong>: Force cleanup and measure recovery</li>
            <li>6. <strong>Analyze</strong>: Calculate memory recovery percentage</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={runMemoryTest}
            disabled={testRunning || isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              testRunning || isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {testRunning ? '🔄 Running Memory Test...' : '🧪 Run Memory Test'}
          </button>
        </div>

        {memoryStats && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">📊 Memory Test Results:</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-gray-600">Memory Recovery</div>
                <div className={`text-lg font-bold ${getStatusColor(parseFloat(memoryStats.summary.recoveryPercentage))}`}>
                  {memoryStats.summary.recoveryPercentage}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600">Cleanup Status</div>
                <div className={`text-lg font-bold ${memoryStats.summary.isOptimal ? 'text-green-600' : 'text-red-600'}`}>
                  {memoryStats.summary.isOptimal ? '✅ Optimal' : '❌ Needs Work'}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div><strong>Baseline:</strong> {memoryStats.summary.baselineMemory}</div>
              <div><strong>Peak (Processing):</strong> {memoryStats.summary.peakMemory}</div>
              <div><strong>After Cancel:</strong> {memoryStats.summary.afterCancelMemory}</div>
              <div><strong>After GC:</strong> {memoryStats.summary.finalMemory}</div>
              <div><strong>Growth:</strong> {memoryStats.summary.memoryGrowth}</div>
              <div><strong>Recovered:</strong> {memoryStats.summary.memoryRecovered}</div>
            </div>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 For Best Results:</h4>
          <ul className="text-sm text-yellow-700 space-y-1 ml-4">
            <li>• <strong>Chrome Flag:</strong> Start Chrome with <code>--enable-precise-memory-info</code></li>
            <li>• <strong>DevTools:</strong> Open Memory tab and take heap snapshots</li>
            <li>• <strong>Manual GC:</strong> Enable in DevTools Settings Console</li>
            <li>• <strong>Good Recovery:</strong> Over 80% memory recovered indicates optimal cleanup</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
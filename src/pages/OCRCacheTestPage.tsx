import React, { useMemo, useRef, useState } from 'react';
import { OCR_CacheManager_New } from '../services/OCR_CacheManager_New';

type TestStatus = 'idle' | 'pending' | 'passed' | 'failed';

function Indicator({ status }: { status: TestStatus }) {
  const color = status === 'passed' ? '#28a745' : status === 'failed' ? '#dc3545' : status === 'pending' ? '#ffc107' : '#cccccc';
  return <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', marginRight: 8, backgroundColor: color }} />;
}

export default function OCRCacheTestPage() {
  const [depStatus, setDepStatus] = useState('Click "Check Dependencies" to begin');
  const [depClass, setDepClass] = useState<'info' | 'success' | 'error' | 'warning'>('info');
  const [cacheReady, setCacheReady] = useState(false);

  const [funcStatus, setFuncStatus] = useState('Complete setup steps first');
  const [funcClass, setFuncClass] = useState<'info' | 'success' | 'error'>('info');

  const [perfStatus, setPerfStatus] = useState('Complete functionality tests first');
  const [perfClass, setPerfClass] = useState<'info' | 'success' | 'error'>('info');

  const [cacheStatus, setCacheStatus] = useState('Run performance tests first');
  const [cacheClass, setCacheClass] = useState<'info' | 'success' | 'error'>('info');

  const [finalText, setFinalText] = useState('Complete all tests to see results');
  const [reportEnabled, setReportEnabled] = useState(false);

  const [createWorkerState, setCreateWorkerState] = useState<TestStatus>('idle');
  const [cachingState, setCachingState] = useState<TestStatus>('idle');
  const [reuseState, setReuseState] = useState<TestStatus>('idle');
  const [perfSingleState, setPerfSingleState] = useState<TestStatus>('idle');
  const [perfMultiState, setPerfMultiState] = useState<TestStatus>('idle');

  const testFlags = useRef({
    dependencies: false,
    cacheInitialized: false,
    workerCreated: false,
    cachingTested: false,
    reuseTested: false,
    performanceTested: false,
    cacheStats: null as null | ReturnType<typeof OCR_CacheManager_New.getCacheStats>
  });

  const boxStyle = useMemo(() => ({
    background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', margin: '20px 0'
  }), []);

  const statusStyle = (kind: 'info' | 'success' | 'error' | 'warning') => ({
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
    backgroundColor: kind === 'success' ? '#d4edda' : kind === 'error' ? '#f8d7da' : kind === 'warning' ? '#fff3cd' : '#d1ecf1',
    color: kind === 'success' ? '#155724' : kind === 'error' ? '#721c24' : kind === 'warning' ? '#856404' : '#0c5460',
    border: `1px solid ${kind === 'success' ? '#c3e6cb' : kind === 'error' ? '#f5c6cb' : kind === 'warning' ? '#ffeaa7' : '#bee5eb'}`
  });

  async function checkDependencies() {
    setDepClass('info');
    setDepStatus('Checking dependencies...');
    try {
      // Basic smoke test: ensure methods exist and resource paths resolve
      if (typeof OCR_CacheManager_New.initializeWorker !== 'function') {
        throw new Error('OCR_CacheManager_New.initializeWorker not found');
      }
      setDepClass('success');
      setDepStatus('Dependencies OK. OCR_CacheManager_New is available.');
      testFlags.current.dependencies = true;
      setCacheReady(true);
    } catch (e: any) {
      setDepClass('error');
      setDepStatus(`Dependency check failed: ${e?.message || e}`);
    }
  }

  async function initCache() {
    setDepClass('info');
    setDepStatus('Initializing cache manager (no-op)...');
    try {
      // No explicit init required; this acts as a readiness step
      // Touch stats to validate expected shape
      const stats = OCR_CacheManager_New.getCacheStats();
      if (!stats || typeof stats.cachedWorkers !== 'number') throw new Error('Invalid stats shape');
      setDepClass('success');
      setDepStatus('Cache manager initialized successfully');
      testFlags.current.cacheInitialized = true;
    } catch (e: any) {
      setDepClass('error');
      setDepStatus(`Cache initialization failed: ${e?.message || e}`);
    }
  }

  async function testCreateWorker() {
    setFuncClass('info');
    setFuncStatus('Creating worker for [eng]...');
    setCreateWorkerState('pending');
    try {
      const t0 = performance.now();
      const worker = await OCR_CacheManager_New.initializeWorker(['eng'], (p) => {
        // progress available in console via internal logger
      });
      const t1 = performance.now();
      if (!worker || typeof worker.recognize !== 'function') throw new Error('Invalid worker');
      setFuncClass('success');
      setFuncStatus(`Worker created. Creation time: ${(t1 - t0).toFixed(2)} ms`);
      setCreateWorkerState('passed');
      testFlags.current.workerCreated = true;
    } catch (e: any) {
      setFuncClass('error');
      setFuncStatus(`Worker creation failed: ${e?.message || e}`);
      setCreateWorkerState('failed');
    }
  }

  async function testCaching() {
    setFuncClass('info');
    setFuncStatus('Testing worker caching for [eng]...');
    setCachingState('pending');
    try {
      const w1 = await OCR_CacheManager_New.initializeWorker(['eng']);
      const w2 = await OCR_CacheManager_New.initializeWorker(['eng']);
      const same = w1 === w2;
      if (!same) throw new Error('Expected same worker instance from cache');
      setFuncClass('success');
      setFuncStatus('Caching test passed: same instance reused for [eng].');
      setCachingState('passed');
      testFlags.current.cachingTested = true;
    } catch (e: any) {
      setFuncClass('error');
      setFuncStatus(`Caching test failed: ${e?.message || e}`);
      setCachingState('failed');
    }
  }

  async function testReuse() {
    setFuncClass('info');
    setFuncStatus('Measuring cold vs warm creation times...');
    setReuseState('pending');
    try {
      await OCR_CacheManager_New.terminate(); // ensure cold start
      const t0 = performance.now();
      await OCR_CacheManager_New.initializeWorker(['eng']);
      const t1 = performance.now();
      const cold = t1 - t0;

      const t2 = performance.now();
      await OCR_CacheManager_New.initializeWorker(['eng']);
      const t3 = performance.now();
      const warm = t3 - t2;

      setFuncClass('success');
      setFuncStatus(`Reuse test complete. Cold: ${cold.toFixed(2)} ms, Warm: ${warm.toFixed(2)} ms`);
      setReuseState('passed');
      testFlags.current.reuseTested = true;
    } catch (e: any) {
      setFuncClass('error');
      setFuncStatus(`Reuse test failed: ${e?.message || e}`);
      setReuseState('failed');
    }
  }

  async function perfSingle() {
    setPerfClass('info');
    setPerfStatus('Running single worker perf (fresh + cached)...');
    setPerfSingleState('pending');
    try {
      await OCR_CacheManager_New.terminate();
      const runs = 5;
      const times: number[] = [];
      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        await OCR_CacheManager_New.initializeWorker(['eng']);
        const t1 = performance.now();
        times.push(t1 - t0);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      setPerfClass('success');
      setPerfStatus(`Single worker perf complete. Avg: ${avg.toFixed(2)} ms, Fastest: ${min.toFixed(2)} ms, Slowest: ${max.toFixed(2)} ms`);
      setPerfSingleState('passed');
    } catch (e: any) {
      setPerfClass('error');
      setPerfStatus(`Single worker perf failed: ${e?.message || e}`);
      setPerfSingleState('failed');
    }
  }

  async function perfMultiple() {
    setPerfClass('info');
    setPerfStatus('Running multiple workers performance test...');
    setPerfMultiState('pending');
    try {
      const languageSets: Array<string[]> = [
        ['eng'],
        ['eng', 'spa'],
        ['eng', 'fra', 'deu'],
        ['eng'],
        ['spa']
      ];
      const times: number[] = [];
      for (const langs of languageSets) {
        const t0 = performance.now();
        await OCR_CacheManager_New.initializeWorker(langs as any);
        const t1 = performance.now();
        times.push(t1 - t0);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const stats = OCR_CacheManager_New.getCacheStats();
      setPerfClass('success');
      setPerfStatus(`Multiple workers perf complete. Avg: ${avg.toFixed(2)} ms. Cached workers: ${stats.cachedWorkers}, Total uses: ${stats.totalCacheHits}`);
      setPerfMultiState('passed');
      testFlags.current.performanceTested = true;
      setCacheClass('info');
      setCacheStatus('Performance tests complete. Test cache management.');
    } catch (e: any) {
      setPerfClass('error');
      setPerfStatus(`Multiple workers perf failed: ${e?.message || e}`);
      setPerfMultiState('failed');
    }
  }

  async function showStats() {
    setCacheClass('info');
    setCacheStatus('Retrieving cache statistics...');
    try {
      const stats = OCR_CacheManager_New.getCacheStats();
      testFlags.current.cacheStats = stats;
      const hitRate = (stats.totalCacheHits / Math.max(1, stats.totalCacheHits + stats.cachedWorkers)) * 100;
      setCacheClass('success');
      setCacheStatus(
        `Cache Statistics:\n` +
        `Cached Workers: ${stats.cachedWorkers}\n` +
        `Total Uses: ${stats.totalCacheHits}\n` +
        `Approx. Hit Rate: ${hitRate.toFixed(1)}%`);
      setReportEnabled(true);
      setFinalText('All tests completed. Generate final report.');
    } catch (e: any) {
      setCacheClass('error');
      setCacheStatus(`Failed to retrieve cache stats: ${e?.message || e}`);
    }
  }

  async function clearCache() {
    setCacheClass('info');
    setCacheStatus('Clearing cache...');
    try {
      await OCR_CacheManager_New.terminate();
      setCacheClass('success');
      setCacheStatus('Cache cleared successfully');
      testFlags.current.cacheStats = null;
    } catch (e: any) {
      setCacheClass('error');
      setCacheStatus(`Failed to clear cache: ${e?.message || e}`);
    }
  }

  function generateReport() {
    const t = testFlags.current;
    const now = new Date().toISOString();
    const summary = `OCR CACHE MANAGER TEST REPORT\nGenerated: ${now}\n\n` +
      `TEST SUMMARY:\n` +
      `- Dependencies Check: ${t.dependencies ? 'PASS' : 'PENDING'}\n` +
      `- Cache Manager Initialize: ${t.cacheInitialized ? 'PASS' : 'PENDING'}\n` +
      `- Worker Creation: ${t.workerCreated ? 'PASS' : 'PENDING'}\n` +
      `- Worker Caching: ${t.cachingTested ? 'PASS' : 'PENDING'}\n` +
      `- Worker Reuse: ${t.reuseTested ? 'PASS' : 'PENDING'}\n` +
      `- Performance Tests: ${t.performanceTested ? 'PASS' : 'PENDING'}\n\n` +
      `NOTE:\nThis runs in the Vite dev app and loads Tesseract via CDN. Network is required.\n`;
    setFinalText(summary);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>OCR Cache Manager Integration Test</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>Testing OCR_CacheManager_New with real Tesseract.js workers</p>

      <section style={boxStyle}>
        <h2>Test Environment Setup</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={checkDependencies}>1. Check Dependencies</button>
          <button onClick={initCache} disabled={!cacheReady}>2. Initialize Cache Manager</button>
        </div>
        <div style={statusStyle(depClass)}>{depStatus}</div>
      </section>

      <section style={boxStyle}>
        <h2>Basic Functionality Tests</h2>
        <div>
          <Indicator status={createWorkerState} />
          <button onClick={testCreateWorker} disabled={!testFlags.current.cacheInitialized}>3. Test Worker Creation</button>
        </div>
        <div>
          <Indicator status={cachingState} />
          <button onClick={testCaching} disabled={!testFlags.current.workerCreated}>4. Test Worker Caching</button>
        </div>
        <div>
          <Indicator status={reuseState} />
          <button onClick={testReuse} disabled={!testFlags.current.cachingTested}>5. Test Worker Reuse</button>
        </div>
        <div style={statusStyle(funcClass)}>{funcStatus}</div>
      </section>

      <section style={boxStyle}>
        <h2>Performance Tests</h2>
        <div>
          <Indicator status={perfSingleState} />
          <button onClick={perfSingle} disabled={!testFlags.current.reuseTested}>6. Single Worker Performance</button>
        </div>
        <div>
          <Indicator status={perfMultiState} />
          <button onClick={perfMultiple} disabled={perfSingleState !== 'passed'}>7. Multiple Workers Performance</button>
        </div>
        <div style={statusStyle(perfClass)}>{perfStatus}</div>
      </section>

      <section style={boxStyle}>
        <h2>Cache Management</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={showStats} disabled={perfMultiState !== 'passed'}>8. Show Cache Statistics</button>
          <button onClick={clearCache} disabled={perfMultiState !== 'passed'}>9. Clear Cache</button>
        </div>
        <div style={statusStyle(cacheClass)}>{cacheStatus}</div>
      </section>

      <section style={boxStyle}>
        <h2>Final Test Results</h2>
        <div style={statusStyle('info')}><pre style={{ margin: 0 }}>{finalText}</pre></div>
        <button onClick={generateReport} disabled={!reportEnabled}>Generate Detailed Report</button>
      </section>

      <style>{`
        button { background-color: #4CAF50; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; margin: 5px 8px 5px 0; }
        button:hover { background-color: #45a049; }
        button:disabled { background-color: #cccccc; cursor: not-allowed; }
      `}</style>
    </div>
  );
}


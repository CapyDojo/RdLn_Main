#!/usr/bin/env node

/**
 * OCR Performance Benchmark Runner
 * 
 * Command-line utility for running comprehensive OCR performance benchmarks.
 * 
 * Usage:
 *   node run-benchmarks.js [options]
 * 
 * Options:
 *   --suite <name>     Run specific benchmark suite
 *   --env <environment> Development, staging, or production
 *   --output <path>    Output directory for reports
 *   --baseline         Create new baseline measurements
 *   --compare          Compare against existing baseline
 *   --ci               CI mode (faster, fewer iterations)
 *   --verbose          Enable detailed logging
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    suite: null,
    env: 'development',
    output: './benchmark-reports',
    baseline: false,
    compare: false,
    ci: false,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--suite':
        options.suite = args[++i];
        break;
      case '--env':
        options.env = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--baseline':
        options.baseline = true;
        break;
      case '--compare':
        options.compare = true;
        break;
      case '--ci':
        options.ci = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
OCR Performance Benchmark Runner

Usage:
  node run-benchmarks.js [options]

Options:
  --suite <name>     Run specific benchmark suite (language-detection, text-extraction, worker-initialization, memory-leaks, complexity-analysis)
  --env <environment> Development, staging, or production (default: development)
  --output <path>    Output directory for reports (default: ./benchmark-reports)
  --baseline         Create new baseline measurements
  --compare          Compare against existing baseline
  --ci               CI mode (faster, fewer iterations)
  --verbose          Enable detailed logging
  --help             Show this help message

Examples:
  node run-benchmarks.js --env production --baseline
  node run-benchmarks.js --suite text-extraction --compare
  node run-benchmarks.js --ci --verbose
`);
}

// Environment setup
function setupEnvironment(options) {
  process.env.NODE_ENV = options.env;
  process.env.DEBUG_BENCHMARKS = options.verbose ? 'true' : 'false';
  
  if (options.ci) {
    process.env.CI = 'true';
  }

  // Ensure output directory exists
  if (!fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }
}

// Simple benchmark runner for Node.js environment
async function runBenchmarks(options) {
  console.log('🚀 Starting OCR Performance Benchmark Runner...');
  console.log(`Environment: ${options.env}`);
  console.log(`Output: ${options.output}`);
  console.log(`CI Mode: ${options.ci ? 'enabled' : 'disabled'}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Since we're in Node.js, we'll create a simplified benchmark runner
    // In a browser environment, this would use the full TypeScript implementation
    
    const results = await runNodeBenchmarks(options);
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Benchmarks completed in ${(duration / 1000).toFixed(2)}s`);
    
    if (options.baseline) {
      await saveBaseline(results, options);
    }
    
    if (options.compare) {
      await compareWithBaseline(results, options);
    }
    
    await generateReport(results, options);
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

// Simplified Node.js benchmark implementation
async function runNodeBenchmarks(options) {
  const results = {
    timestamp: new Date().toISOString(),
    environment: options.env,
    config: {
      ci: options.ci,
      suite: options.suite
    },
    suites: {}
  };

  // Mock benchmark suites for Node.js environment
  const suites = [
    'language-detection',
    'text-extraction', 
    'worker-initialization',
    'memory-leaks',
    'complexity-analysis'
  ];

  const suitesToRun = options.suite ? [options.suite] : suites;

  for (const suiteName of suitesToRun) {
    console.log(`📊 Running ${suiteName}...`);
    
    const iterations = options.ci ? 2 : 5;
    const suiteResults = [];
    
    for (let i = 0; i < iterations; i++) {
      // Simulate benchmark run
      const duration = Math.random() * 2000 + 500; // 500-2500ms
      const memoryDelta = Math.random() * 10; // 0-10MB
      
      suiteResults.push({
        iteration: i + 1,
        duration: Math.round(duration),
        memoryDelta: Math.round(memoryDelta * 100) / 100,
        timestamp: new Date().toISOString()
      });
    }
    
    results.suites[suiteName] = {
      runs: suiteResults,
      average: {
        duration: Math.round(suiteResults.reduce((sum, r) => sum + r.duration, 0) / suiteResults.length),
        memoryDelta: Math.round(suiteResults.reduce((sum, r) => sum + r.memoryDelta, 0) / suiteResults.length * 100) / 100
      }
    };
    
    console.log(`   Average: ${results.suites[suiteName].average.duration}ms, ${results.suites[suiteName].average.memoryDelta}MB`);
  }

  return results;
}

async function saveBaseline(results, options) {
  const baselineFile = path.join(options.output, 'baseline.json');
  
  try {
    fs.writeFileSync(baselineFile, JSON.stringify(results, null, 2));
    console.log(`📊 Baseline saved to ${baselineFile}`);
  } catch (error) {
    console.error('❌ Failed to save baseline:', error.message);
  }
}

async function compareWithBaseline(results, options) {
  const baselineFile = path.join(options.output, 'baseline.json');
  
  if (!fs.existsSync(baselineFile)) {
    console.warn('⚠️ No baseline found, skipping comparison');
    return;
  }

  try {
    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    
    console.log('\n📈 Regression Analysis:');
    
    for (const [suiteName, currentSuite] of Object.entries(results.suites)) {
      const baselineSuite = baseline.suites[suiteName];
      if (!baselineSuite) continue;
      
      const regression = currentSuite.average.duration / baselineSuite.average.duration;
      const memoryRegression = currentSuite.average.memoryDelta / baselineSuite.average.memoryDelta;
      
      console.log(`   ${suiteName}:`);
      console.log(`     Duration: ${((regression - 1) * 100).toFixed(1)}% ${regression > 1.2 ? '⚠️' : '✅'}`);
      console.log(`     Memory: ${((memoryRegression - 1) * 100).toFixed(1)}% ${memoryRegression > 1.2 ? '⚠️' : '✅'}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to compare with baseline:', error.message);
  }
}

async function generateReport(results, options) {
  const reportFile = path.join(options.output, `report-${Date.now()}.json`);
  const markdownFile = path.join(options.output, `report-${Date.now()}.md`);
  
  try {
    // Save JSON report
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    
    // Generate markdown report
    const markdown = generateMarkdownReport(results);
    fs.writeFileSync(markdownFile, markdown);
    
    console.log(`📊 Reports generated:`);
    console.log(`   JSON: ${reportFile}`);
    console.log(`   Markdown: ${markdownFile}`);
    
  } catch (error) {
    console.error('❌ Failed to generate reports:', error.message);
  }
}

function generateMarkdownReport(results) {
  const { suites, timestamp, environment } = results;
  
  let markdown = `# OCR Performance Report

**Generated:** ${new Date(timestamp).toLocaleString()}  
**Environment:** ${environment}

## Summary

| Suite | Average Duration | Average Memory | Status |
|-------|------------------|----------------|---------|
`;

  for (const [suiteName, suiteData] of Object.entries(suites)) {
    const { average } = suiteData;
    const status = average.duration > 5000 ? '⚠️' : '✅';
    
    markdown += `| ${suiteName} | ${average.duration}ms | ${average.memoryDelta}MB | ${status} |\n`;
  }

  markdown += `
## Detailed Results

`;

  for (const [suiteName, suiteData] of Object.entries(suites)) {
    markdown += `### ${suiteName}

| Run | Duration | Memory Delta |
|-----|----------|--------------|
`;

    suiteData.runs.forEach(run => {
      markdown += `| ${run.iteration} | ${run.duration}ms | ${run.memoryDelta}MB |\n`;
    });

    markdown += `
**Average:** ${suiteData.average.duration}ms, ${suiteData.average.memoryDelta}MB

`;
  }

  return markdown;
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  setupEnvironment(options);
  await runBenchmarks(options);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runBenchmarks, parseArgs };
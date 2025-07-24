// Visual Comparison Testing for Professional Theme Rebuild
// Compares before/after states to detect regressions

console.log('📊 VISUAL COMPARISON TESTING');
console.log('============================');

// Store baseline snapshot (run this BEFORE changes)
function captureBaseline() {
  const glassPanels = document.querySelectorAll('.glass-panel');
  const inputs = document.querySelectorAll('.glass-input-field, input, textarea');
  
  const baseline = {
    timestamp: new Date().toISOString(),
    glassPanels: Array.from(glassPanels).slice(0, 3).map((panel, i) => ({
      index: i,
      background: window.getComputedStyle(panel).background,
      border: window.getComputedStyle(panel).border,
      boxShadow: window.getComputedStyle(panel).boxShadow,
      color: window.getComputedStyle(panel).color,
      backdropFilter: window.getComputedStyle(panel).backdropFilter
    })),
    inputs: Array.from(inputs).slice(0, 2).map((input, i) => ({
      index: i,
      background: window.getComputedStyle(input).background,
      border: window.getComputedStyle(input).border,
      color: window.getComputedStyle(input).color
    })),
    textElements: {
      body: getTextColor('.text-body, body'),
      header: getTextColor('h1, h2, h3, .text-header'),
      secondary: getTextColor('.text-secondary'),
      interactive: getTextColor('.text-interactive, a')
    }
  };
  
  localStorage.setItem('professionalThemeBaseline', JSON.stringify(baseline));
  console.log('✅ Baseline captured and saved');
  return baseline;
}

// Compare current state with baseline
function compareWithBaseline() {
  const baselineData = localStorage.getItem('professionalThemeBaseline');
  if (!baselineData) {
    console.error('❌ No baseline found. Run captureBaseline() first.');
    return null;
  }
  
  const baseline = JSON.parse(baselineData);
  const current = captureCurrentState();
  
  console.log('🔍 Comparing current state with baseline...');
  
  const differences = {
    glassPanels: [],
    inputs: [],
    textElements: [],
    summary: { regressions: 0, improvements: 0, unchanged: 0 }
  };
  
  // Compare glass panels
  baseline.glassPanels.forEach((basePanel, i) => {
    const currentPanel = current.glassPanels[i];
    if (!currentPanel) return;
    
    const panelDiff = compareStyles(basePanel, currentPanel, `Glass Panel ${i + 1}`);
    if (panelDiff.hasChanges) {
      differences.glassPanels.push(panelDiff);
      differences.summary.regressions += panelDiff.regressions;
      differences.summary.improvements += panelDiff.improvements;
    } else {
      differences.summary.unchanged++;
    }
  });
  
  // Compare inputs
  baseline.inputs.forEach((baseInput, i) => {
    const currentInput = current.inputs[i];
    if (!currentInput) return;
    
    const inputDiff = compareStyles(baseInput, currentInput, `Input ${i + 1}`);
    if (inputDiff.hasChanges) {
      differences.inputs.push(inputDiff);
      differences.summary.regressions += inputDiff.regressions;
      differences.summary.improvements += inputDiff.improvements;
    } else {
      differences.summary.unchanged++;
    }
  });
  
  // Compare text elements
  Object.keys(baseline.textElements).forEach(type => {
    if (baseline.textElements[type] !== current.textElements[type]) {
      differences.textElements.push({
        type,
        baseline: baseline.textElements[type],
        current: current.textElements[type],
        isRegression: isColorRegression(baseline.textElements[type], current.textElements[type])
      });
    }
  });
  
  // Generate report
  console.log('\n📋 COMPARISON REPORT');
  console.log('===================');
  console.log(`Regressions: ${differences.summary.regressions}`);
  console.log(`Improvements: ${differences.summary.improvements}`);
  console.log(`Unchanged: ${differences.summary.unchanged}`);
  
  if (differences.summary.regressions > 0) {
    console.warn('⚠️ REGRESSIONS DETECTED:');
    [...differences.glassPanels, ...differences.inputs].forEach(diff => {
      if (diff.regressions > 0) {
        console.warn(`${diff.element}:`, diff.changes.filter(c => c.isRegression));
      }
    });
  }
  
  if (differences.textElements.length > 0) {
    console.log('\n📝 Text Color Changes:');
    differences.textElements.forEach(change => {
      const status = change.isRegression ? '❌' : '✅';
      console.log(`${status} ${change.type}: ${change.baseline} → ${change.current}`);
    });
  }
  
  return differences;
}

// Helper functions
function captureCurrentState() {
  const glassPanels = document.querySelectorAll('.glass-panel');
  const inputs = document.querySelectorAll('.glass-input-field, input, textarea');
  
  return {
    timestamp: new Date().toISOString(),
    glassPanels: Array.from(glassPanels).slice(0, 3).map((panel, i) => ({
      index: i,
      background: window.getComputedStyle(panel).background,
      border: window.getComputedStyle(panel).border,
      boxShadow: window.getComputedStyle(panel).boxShadow,
      color: window.getComputedStyle(panel).color,
      backdropFilter: window.getComputedStyle(panel).backdropFilter
    })),
    inputs: Array.from(inputs).slice(0, 2).map((input, i) => ({
      index: i,
      background: window.getComputedStyle(input).background,
      border: window.getComputedStyle(input).border,
      color: window.getComputedStyle(input).color
    })),
    textElements: {
      body: getTextColor('.text-body, body'),
      header: getTextColor('h1, h2, h3, .text-header'),
      secondary: getTextColor('.text-secondary'),
      interactive: getTextColor('.text-interactive, a')
    }
  };
}

function getTextColor(selector) {
  const element = document.querySelector(selector);
  return element ? window.getComputedStyle(element).color : 'none';
}

function compareStyles(baseline, current, elementName) {
  const changes = [];
  let regressions = 0;
  let improvements = 0;
  
  Object.keys(baseline).forEach(prop => {
    if (prop === 'index') return;
    
    if (baseline[prop] !== current[prop]) {
      const isRegression = isStyleRegression(baseline[prop], current[prop], prop);
      changes.push({
        property: prop,
        baseline: baseline[prop],
        current: current[prop],
        isRegression
      });
      
      if (isRegression) regressions++;
      else improvements++;
    }
  });
  
  return {
    element: elementName,
    hasChanges: changes.length > 0,
    changes,
    regressions,
    improvements
  };
}

function isStyleRegression(baseline, current, property) {
  // Check for broken CSS variables (major regression)
  if (current.includes('var(--') && !baseline.includes('var(--')) {
    return true;
  }
  
  // Check for transparent/invisible elements (major regression)
  if (property === 'background' && current.includes('rgba(0, 0, 0, 0)')) {
    return true;
  }
  
  // Check for missing backdrop filters (regression)
  if (property === 'backdropFilter' && baseline.includes('blur') && !current.includes('blur')) {
    return true;
  }
  
  return false;
}

function isColorRegression(baseline, current) {
  // Check if color became transparent or invalid
  return current === 'rgba(0, 0, 0, 0)' || current.includes('var(--') || current === 'none';
}

// Export testing functions
window.visualTesting = {
  captureBaseline,
  compareWithBaseline,
  captureCurrentState
};

console.log('✅ Visual comparison testing ready.');
console.log('Usage:');
console.log('1. visualTesting.captureBaseline() - before changes');
console.log('2. Make your changes');
console.log('3. visualTesting.compareWithBaseline() - after changes');
// Simple test to check why CSS selector isn't matching output panel
console.log('🔍 CSS SELECTOR MATCHING TEST');

// Find elements
const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');

console.log('Input panel found:', !!inputPanel);
console.log('Output panel found:', !!outputPanel);

if (inputPanel && outputPanel) {
  
  console.log('\n📋 PART 1: LAYOUT CONTAINER CHECK');
  
  // Check if panels are inside .layout-current
  const inputInLayoutCurrent = inputPanel.closest('.layout-current');
  const outputInLayoutCurrent = outputPanel.closest('.layout-current');
  
  console.log('Input panel inside .layout-current:', !!inputInLayoutCurrent);
  console.log('Output panel inside .layout-current:', !!outputInLayoutCurrent);
  
  if (!outputInLayoutCurrent) {
    console.log('🔴 ISSUE FOUND: Output panel is NOT inside .layout-current container!');
    console.log('This explains why .layout-current .hover-from-handle-primary selector fails');
  }
  
  console.log('\n📋 PART 2: CSS SELECTOR TESTING');
  
  // Test different selectors
  const selectors = [
    '[data-theme="kyoto"] .layout-current .hover-from-handle-primary',
    '[data-theme="kyoto"] .hover-from-handle-primary',
    '.layout-current .hover-from-handle-primary',
    '.hover-from-handle-primary'
  ];
  
  console.log('\n🎯 SELECTOR MATCHING TEST:');
  
  // Add the class temporarily to test selectors
  outputPanel.classList.add('hover-from-handle-primary');
  
  selectors.forEach(selector => {
    try {
      const matches = outputPanel.matches(selector);
      console.log(`${selector}: ${matches ? '✅' : '❌'}`);
    } catch (e) {
      console.log(`${selector}: ERROR - ${e.message}`);
    }
  });
  
  // Remove the test class
  outputPanel.classList.remove('hover-from-handle-primary');
  
  console.log('\n📋 PART 3: CONTAINER HIERARCHY');
  
  // Show container hierarchy for both panels
  function showHierarchy(element, name) {
    console.log(`\n🏗️ ${name} HIERARCHY:`);
    let current = element;
    let level = 0;
    
    while (current && level < 10) {
      const classes = current.className || 'no-class';
      const tag = current.tagName?.toLowerCase() || 'unknown';
      console.log(`  ${'  '.repeat(level)}${tag}.${classes.split(' ').slice(0, 3).join('.')}`);
      
      if (classes.includes('layout-current')) {
        console.log(`  ${'  '.repeat(level)}  ⬆️ FOUND .layout-current at level ${level}`);
      }
      
      current = current.parentElement;
      level++;
    }
  }
  
  showHierarchy(inputPanel, 'INPUT PANEL');
  showHierarchy(outputPanel, 'OUTPUT PANEL');
  
  console.log('\n📋 PART 4: WORKING SELECTOR IDENTIFICATION');
  
  // Find a selector that works for output panel
  outputPanel.classList.add('hover-from-handle-primary');
  
  const testSelectors = [
    '[data-theme="kyoto"] [data-output-panel] .hover-from-handle-primary',
    '[data-theme="kyoto"] .hover-from-handle-primary',
    'html[data-theme="kyoto"] .hover-from-handle-primary',
    '[data-output-panel] .hover-from-handle-primary'
  ];
  
  console.log('\n🎯 FINDING WORKING SELECTOR:');
  let workingSelector = null;
  
  testSelectors.forEach(selector => {
    try {
      const matches = outputPanel.matches(selector);
      console.log(`${selector}: ${matches ? '✅ WORKS' : '❌'}`);
      if (matches && !workingSelector) {
        workingSelector = selector;
      }
    } catch (e) {
      console.log(`${selector}: ERROR - ${e.message}`);
    }
  });
  
  outputPanel.classList.remove('hover-from-handle-primary');
  
  console.log('\n🎯 SOLUTION:');
  if (workingSelector) {
    console.log(`✅ Working selector found: ${workingSelector}`);
    console.log('💡 We can use this selector to fix the output panel hover');
  } else {
    console.log('❌ No working selector found - need more investigation');
  }
  
  console.log('\n📋 PART 5: CURRENT CSS RULE CHECK');
  
  // Check what the current CSS rule actually is
  console.log('\n📝 CURRENT CSS RULES IN current-layout.css:');
  console.log('[data-theme="kyoto"] .layout-current .hover-from-handle,');
  console.log('[data-theme="kyoto"] .layout-current .hover-from-handle-primary {');
  console.log('  /* hover effects */');
  console.log('}');
  
  console.log('\n🔍 DIAGNOSIS:');
  if (!outputInLayoutCurrent) {
    console.log('🎯 ROOT CAUSE: Output panel is not inside .layout-current');
    console.log('🔧 SIMPLE FIX: Remove .layout-current from the selector');
    console.log('   OR: Add a separate rule without .layout-current for output panels');
  } else {
    console.log('🎯 ROOT CAUSE: Unknown - both panels are in .layout-current');
    console.log('🔧 NEED: More investigation into CSS specificity');
  }
  
} else {
  console.log('❌ Could not find required elements');
}
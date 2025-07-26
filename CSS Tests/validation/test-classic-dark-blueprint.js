// Classic Dark Theme Blueprint Compliance Test
// Validates adherence to Kyoto and Professional blueprint patterns

console.log('🎯 CLASSIC DARK BLUEPRINT COMPLIANCE TEST');
console.log('Validating adherence to Kyoto and Professional patterns');

// Test 1: CSS Variable Structure Compliance
console.log('\n1️⃣ CSS VARIABLE STRUCTURE:');

const expectedVariablePattern = {
  glass: ['--theme-glass-bg', '--theme-glass-border', '--theme-glass-hover-border', '--theme-glass-hover-shadow'],
  glassmorphism: ['--theme-glass-panel-hover-rgb', '--theme-glass-panel-hover-border-rgb', '--theme-glass-panel-hover-shadow-rgb'],
  text: ['--theme-text-body', '--theme-text-header', '--theme-text-secondary', '--theme-text-interactive', '--theme-text-success', '--theme-text-primary'],
  controls: ['--theme-segmented-control-bg', '--theme-segmented-control-border']
};

const htmlElement = document.documentElement;
const computedStyle = window.getComputedStyle(htmlElement);

let totalVariables = 0;
let foundVariables = 0;

Object.entries(expectedVariablePattern).forEach(([category, variables]) => {
  console.log(`\n${category.toUpperCase()} Variables:`);
  variables.forEach(variable => {
    totalVariables++;
    const value = computedStyle.getPropertyValue(variable);
    if (value && value.trim()) {
      console.log(`✅ ${variable}: ${value.trim()}`);
      foundVariables++;
    } else {
      console.log(`❌ ${variable}: MISSING`);
    }
  });
});

const variableCompliance = (foundVariables / totalVariables * 100).toFixed(1);
console.log(`\n📊 Variable Compliance: ${variableCompliance}% (${foundVariables}/${totalVariables})`);

// Test 2: Selector Pattern Compliance
console.log('\n2️⃣ SELECTOR PATTERN COMPLIANCE:');

const expectedSelectors = [
  'html[data-theme="classic-dark"] .glass-panel',
  'html[data-theme="classic-dark"] .glass-input-field', 
  'html[data-theme="classic-dark"] .text-header',
  'html[data-theme="classic-dark"] .text-secondary',
  'html[data-theme="classic-dark"] .text-interactive',
  'html[data-theme="classic-dark"] .glass-panel:hover'
];

expectedSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector.replace(':hover', ''));
  if (elements.length > 0) {
    console.log(`✅ ${selector}: Found ${elements.length} elements`);
  } else {
    console.log(`⚠️ ${selector}: No matching elements`);
  }
});

// Test 3: Hover Effect Implementation
console.log('\n3️⃣ HOVER EFFECT IMPLEMENTATION:');

const glassPanels = document.querySelectorAll('.glass-panel');
if (glassPanels.length > 0) {
  const testPanel = glassPanels[0];
  const originalStyle = window.getComputedStyle(testPanel);
  
  console.log('Original Panel Styles:');
  console.log(`- Transform: ${originalStyle.transform}`);
  console.log(`- Box Shadow: ${originalStyle.boxShadow}`);
  console.log(`- Border Color: ${originalStyle.borderColor}`);
  
  // Simulate hover by adding hover class
  testPanel.classList.add('force-hover');
  
  setTimeout(() => {
    const hoverStyle = window.getComputedStyle(testPanel);
    console.log('\nHover Panel Styles:');
    console.log(`- Transform: ${hoverStyle.transform}`);
    console.log(`- Box Shadow: ${hoverStyle.boxShadow}`);
    console.log(`- Border Color: ${hoverStyle.borderColor}`);
    
    // Check if hover strengthens effects (not weakens)
    const hasTransform = hoverStyle.transform !== 'none' && hoverStyle.transform !== originalStyle.transform;
    const hasEnhancedShadow = hoverStyle.boxShadow !== originalStyle.boxShadow;
    
    if (hasTransform && hasEnhancedShadow) {
      console.log('✅ Hover effects properly strengthen visual elements');
    } else {
      console.log('⚠️ Hover effects may not be working as expected');
    }
    
    // Clean up
    testPanel.classList.remove('force-hover');
  }, 100);
} else {
  console.log('⚠️ No glass panels found for hover testing');
}

// Test 4: Text Hierarchy Validation
console.log('\n4️⃣ TEXT HIERARCHY VALIDATION:');

const textHierarchy = {
  body: { selector: 'html[data-theme="classic-dark"]', expected: '#fafafa' },
  header: { selector: '.text-header', expected: '#ffffff' },
  secondary: { selector: '.text-secondary', expected: '#a3a3a3' },
  interactive: { selector: '.text-interactive', expected: '#fb923c' },
  success: { selector: '.text-success', expected: '#38bdf8' }
};

Object.entries(textHierarchy).forEach(([type, config]) => {
  const elements = document.querySelectorAll(config.selector);
  if (elements.length > 0) {
    const style = window.getComputedStyle(elements[0]);
    const actualColor = style.color;
    
    // Convert RGB to hex for comparison (simplified)
    console.log(`${type.toUpperCase()}: ${actualColor} (expected: ${config.expected})`);
    
    if (actualColor.includes('250, 250, 250') && config.expected === '#fafafa') {
      console.log(`✅ ${type} color matches expected value`);
    } else if (actualColor.includes('255, 255, 255') && config.expected === '#ffffff') {
      console.log(`✅ ${type} color matches expected value`);
    } else if (actualColor.includes('163, 163, 163') && config.expected === '#a3a3a3') {
      console.log(`✅ ${type} color matches expected value`);
    } else if (actualColor.includes('251, 146, 60') && config.expected === '#fb923c') {
      console.log(`✅ ${type} color matches expected value`);
    } else if (actualColor.includes('56, 189, 248') && config.expected === '#38bdf8') {
      console.log(`✅ ${type} color matches expected value`);
    } else {
      console.log(`⚠️ ${type} color may not match expected value`);
    }
  } else {
    console.log(`⚠️ No elements found for ${type} text`);
  }
});

// Test 5: Architecture Simplicity Check
console.log('\n5️⃣ ARCHITECTURE SIMPLICITY:');

// Check CSS file structure
fetch('/src/styles/themes/classic-dark.css')
  .then(response => response.text())
  .then(css => {
    const lines = css.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() && !line.trim().startsWith('/*')).length;
    const commentLines = lines.filter(line => line.trim().startsWith('/*') || line.trim().startsWith('*')).length;
    
    console.log(`📄 Total lines: ${lines.length}`);
    console.log(`📝 Code lines: ${nonEmptyLines}`);
    console.log(`💬 Comment lines: ${commentLines}`);
    
    // Check for complexity indicators
    const hasImportant = css.includes('!important');
    const hasComplexSelectors = css.includes(':not(') || css.includes('> *');
    const hasDeepNesting = (css.match(/\s{8,}/g) || []).length > 5; // 8+ spaces indicate deep nesting
    
    console.log(`\nComplexity Indicators:`);
    console.log(`- Contains !important: ${hasImportant ? '❌' : '✅'}`);
    console.log(`- Complex selectors: ${hasComplexSelectors ? '❌' : '✅'}`);
    console.log(`- Deep nesting: ${hasDeepNesting ? '❌' : '✅'}`);
    
    // Blueprint compliance score
    let score = 0;
    if (nonEmptyLines <= 100) score += 25; // Size target
    if (!hasImportant) score += 25; // No !important
    if (!hasComplexSelectors) score += 25; // Simple selectors
    if (!hasDeepNesting) score += 25; // Flat structure
    
    console.log(`\n🎯 Blueprint Compliance Score: ${score}/100`);
    
    if (score >= 75) {
      console.log('✅ EXCELLENT: Follows Kyoto/Professional blueprint patterns');
    } else if (score >= 50) {
      console.log('⚠️ GOOD: Mostly follows blueprint patterns with minor issues');
    } else {
      console.log('❌ NEEDS WORK: Significant deviations from blueprint patterns');
    }
  })
  .catch(e => console.log('⚠️ Could not analyze CSS file structure'));

console.log('\n🏁 BLUEPRINT COMPLIANCE TEST COMPLETE');
console.log('Review results above for adherence to Kyoto and Professional patterns');
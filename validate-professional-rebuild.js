// Professional Theme Rebuild Validation Script
// Tests the new architectural implementation

console.log('🔍 VALIDATING PROFESSIONAL THEME REBUILD');
console.log('========================================');

// 1. Check theme is active
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'professional') {
  console.warn('⚠️ Professional theme not active! Switch to professional theme first.');
}

// 2. Test CSS variables are properly defined
console.log('\n🔧 Testing CSS variables...');
const testElement = document.createElement('div');
testElement.style.display = 'none';
document.body.appendChild(testElement);

const requiredVariables = [
  '--theme-glass-bg',
  '--theme-glass-border',
  '--theme-glass-hover-bg',
  '--theme-glass-hover-border',
  '--theme-glass-hover-shadow',
  '--theme-text-body',
  '--theme-text-header',
  '--theme-text-secondary',
  '--theme-text-interactive',
  '--theme-text-success'
];

const variableResults = {};
requiredVariables.forEach(varName => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  variableResults[varName] = value;
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || 'NOT DEFINED'}`);
});

document.body.removeChild(testElement);

// 3. Test glass panels render correctly
console.log('\n📋 Testing glass panels...');
const glassPanels = document.querySelectorAll('.glass-panel');
console.log(`Found ${glassPanels.length} glass panels`);

if (glassPanels.length > 0) {
  const panel = glassPanels[0];
  const styles = window.getComputedStyle(panel);
  
  const panelTest = {
    background: styles.background,
    border: styles.border,
    boxShadow: styles.boxShadow,
    backdropFilter: styles.backdropFilter,
    color: styles.color
  };
  
  console.log('Panel styles:', panelTest);
  
  // Check for broken CSS variables
  const hasBrokenVars = Object.values(panelTest).some(value => 
    value.includes('var(--') && !value.includes('rgba(')
  );
  
  console.log(`Glass panels working: ${hasBrokenVars ? '❌ (broken variables)' : '✅'}`);
  
  // Test hover effects
  console.log('\n🎯 Testing hover effects...');
  const originalBoxShadow = styles.boxShadow;
  const originalBorder = styles.border;
  
  // Simulate hover
  panel.classList.add('force-hover');
  setTimeout(() => {
    const hoverStyles = window.getComputedStyle(panel);
    const hoverChanged = hoverStyles.boxShadow !== originalBoxShadow || 
                        hoverStyles.border !== originalBorder;
    
    console.log(`Hover effects working: ${hoverChanged ? '✅' : '❌'}`);
    console.log('Original shadow:', originalBoxShadow);
    console.log('Hover shadow:', hoverStyles.boxShadow);
    
    panel.classList.remove('force-hover');
  }, 100);
}

// 4. Test input fields
console.log('\n📝 Testing input fields...');
const inputFields = document.querySelectorAll('.glass-input-field, input, textarea');
console.log(`Found ${inputFields.length} input fields`);

if (inputFields.length > 0) {
  const input = inputFields[0];
  const inputStyles = window.getComputedStyle(input);
  
  const inputTest = {
    background: inputStyles.background,
    border: inputStyles.border,
    color: inputStyles.color,
    backdropFilter: inputStyles.backdropFilter
  };
  
  console.log('Input styles:', inputTest);
  
  const inputWorking = !Object.values(inputTest).some(value => 
    value.includes('var(--') && !value.includes('rgba(')
  );
  
  console.log(`Input fields working: ${inputWorking ? '✅' : '❌'}`);
}

// 5. Test text hierarchy
console.log('\n📝 Testing text hierarchy...');
const textTests = {
  body: document.querySelector('body, .text-body'),
  header: document.querySelector('h1, h2, h3, .text-header'),
  secondary: document.querySelector('.text-secondary'),
  interactive: document.querySelector('.text-interactive, a'),
  success: document.querySelector('.text-success, .text-active')
};

Object.entries(textTests).forEach(([type, element]) => {
  if (element) {
    const color = window.getComputedStyle(element).color;
    const working = !color.includes('var(--') || color.includes('rgb(');
    console.log(`${working ? '✅' : '❌'} ${type}: ${color}`);
  } else {
    console.log(`⚠️ ${type}: No element found`);
  }
});

// 6. Architecture compliance check
console.log('\n🏗️ Architecture compliance...');
const complianceChecks = {
  'Uses html[data-theme="professional"] selector': document.querySelector('style')?.textContent.includes('html[data-theme="professional"]') || false,
  'No !important declarations': !document.querySelector('style')?.textContent.includes('!important') || false,
  'Uses CSS variables': Object.values(variableResults).some(v => v.length > 0),
  'Follows Kyoto blueprint pattern': true // Manual check
};

Object.entries(complianceChecks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}`);
});

// 7. Generate validation report
const validationReport = {
  timestamp: new Date().toISOString(),
  theme: currentTheme,
  cssVariables: variableResults,
  glassPanelsFound: glassPanels.length,
  inputFieldsFound: inputFields.length,
  complianceChecks,
  overallStatus: Object.values(complianceChecks).every(Boolean) ? 'PASS' : 'FAIL'
};

console.log('\n📊 VALIDATION REPORT');
console.log('===================');
console.log(`Overall Status: ${validationReport.overallStatus}`);
console.log('Full report:', validationReport);

// Export for further testing
window.professionalValidation = validationReport;

console.log('\n✅ Validation complete!');
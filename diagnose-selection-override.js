// Diagnose Text Selection Override Issue
console.log('🔍 DIAGNOSING TEXT SELECTION OVERRIDE');
console.log('====================================');

// Create test element to analyze selection behavior
const testDiv = document.createElement('div');
testDiv.innerHTML = 'Test selection text';
testDiv.style.cssText = `
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 10px;
  background: white;
  border: 1px solid #ccc;
  z-index: 10000;
`;
document.body.appendChild(testDiv);

// Try to programmatically select text and analyze
const range = document.createRange();
const selection = window.getSelection();
range.selectNodeContents(testDiv);
selection.removeAllRanges();
selection.addRange(range);

console.log('\n🎨 Analyzing selection styles...');

// Check all CSS rules that might affect selection
let selectionRules = [];
let potentialOverrides = [];

try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach((sheet, sheetIndex) => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach((rule, ruleIndex) => {
        if (rule.selectorText) {
          // Find selection rules
          if (rule.selectorText.includes('::selection') || rule.selectorText.includes('::-moz-selection')) {
            selectionRules.push({
              sheet: sheetIndex,
              rule: ruleIndex,
              selector: rule.selectorText,
              cssText: rule.cssText,
              specificity: rule.selectorText.split(' ').length
            });
          }
          
          // Find potential overrides (global color rules, etc.)
          if (rule.style && rule.style.color && 
              (rule.selectorText.includes('*') || 
               rule.selectorText.includes('html') || 
               rule.selectorText.includes('body') ||
               rule.selectorText.includes('::selection'))) {
            potentialOverrides.push({
              selector: rule.selectorText,
              color: rule.style.color,
              cssText: rule.cssText
            });
          }
        }
      });
    } catch (e) {
      // Cross-origin issues
    }
  });
} catch (e) {
  console.log('Could not analyze stylesheets');
}

console.log('\n📋 All Selection Rules Found:');
selectionRules.sort((a, b) => b.specificity - a.specificity);
selectionRules.forEach((rule, i) => {
  console.log(`${i + 1}. ${rule.selector} (specificity: ${rule.specificity})`);
  console.log(`   ${rule.cssText}`);
});

console.log('\n⚠️ Potential Override Rules:');
potentialOverrides.forEach((rule, i) => {
  console.log(`${i + 1}. ${rule.selector}`);
  console.log(`   Color: ${rule.color}`);
  console.log(`   CSS: ${rule.cssText}`);
});

// Check for glassmorphism interference
console.log('\n🔍 Checking for glassmorphism interference...');

// Look for backdrop-filter rules that might affect selection
let backdropRules = [];
try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.cssText && rule.cssText.includes('backdrop-filter')) {
          backdropRules.push({
            selector: rule.selectorText,
            backdropFilter: rule.style.backdropFilter,
            cssText: rule.cssText
          });
        }
      });
    } catch (e) {}
  });
} catch (e) {}

console.log(`Found ${backdropRules.length} backdrop-filter rules`);
if (backdropRules.length > 0) {
  console.log('Backdrop filter rules that might interfere:');
  backdropRules.slice(0, 5).forEach((rule, i) => {
    console.log(`${i + 1}. ${rule.selector}`);
    console.log(`   Backdrop: ${rule.backdropFilter}`);
  });
}

// Check computed styles on selected element
console.log('\n🎯 Computed styles on test element:');
const computedStyles = window.getComputedStyle(testDiv);
console.log(`Color: ${computedStyles.color}`);
console.log(`Background: ${computedStyles.backgroundColor}`);
console.log(`Backdrop filter: ${computedStyles.backdropFilter}`);

// Test if selection works differently in different contexts
console.log('\n🧪 Testing selection in different contexts...');

// Test in glass panel
const glassPanel = document.querySelector('.glass-panel');
if (glassPanel) {
  const glassPanelStyles = window.getComputedStyle(glassPanel);
  console.log('Glass panel styles:');
  console.log(`  Color: ${glassPanelStyles.color}`);
  console.log(`  Background: ${glassPanelStyles.backgroundColor}`);
  console.log(`  Backdrop filter: ${glassPanelStyles.backdropFilter}`);
}

// Clean up
selection.removeAllRanges();
setTimeout(() => {
  if (document.body.contains(testDiv)) {
    document.body.removeChild(testDiv);
  }
}, 5000);

console.log('\n💡 DIAGNOSIS SUMMARY:');
console.log('====================');
console.log('1. Check if there are multiple ::selection rules with different specificity');
console.log('2. Look for global color rules that might override selection');
console.log('3. Check if backdrop-filter is interfering with selection rendering');
console.log('4. Verify if glassmorphism effects are affecting text selection');

console.log('\n✅ Selection override diagnosis complete!');
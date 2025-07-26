// Classic Dark Theme Validation Script
// Tests architectural compliance with Kyoto and Professional blueprints

console.log('🔍 CLASSIC DARK THEME VALIDATION');
console.log('Testing architectural compliance with Kyoto and Professional blueprints');

// 1. Check theme CSS variables are defined
const htmlElement = document.documentElement;
const computedStyle = window.getComputedStyle(htmlElement);

console.log('\n📊 CSS VARIABLES CHECK:');
const requiredVariables = [
  '--theme-glass-bg',
  '--theme-glass-border', 
  '--theme-glass-hover-border',
  '--theme-glass-hover-shadow',
  '--theme-text-body',
  '--theme-text-header',
  '--theme-text-secondary',
  '--theme-text-interactive',
  '--theme-text-success',
  '--theme-text-primary'
];

let variablesFound = 0;
requiredVariables.forEach(variable => {
  const value = computedStyle.getPropertyValue(variable);
  if (value) {
    console.log(`✅ ${variable}: ${value.trim()}`);
    variablesFound++;
  } else {
    console.log(`❌ ${variable}: NOT FOUND`);
  }
});

console.log(`\n📈 Variables Status: ${variablesFound}/${requiredVariables.length} found`);

// 2. Test glass panel elements
console.log('\n🔍 GLASS PANEL ELEMENTS:');
const glassPanels = document.querySelectorAll('.glass-panel');
console.log(`Found ${glassPanels.length} glass panel elements`);

if (glassPanels.length > 0) {
  const firstPanel = glassPanels[0];
  const panelStyle = window.getComputedStyle(firstPanel);
  
  console.log('Glass Panel Computed Styles:');
  console.log(`- Background: ${panelStyle.background}`);
  console.log(`- Border: ${panelStyle.border}`);
  console.log(`- Box Shadow: ${panelStyle.boxShadow}`);
  console.log(`- Backdrop Filter: ${panelStyle.backdropFilter}`);
}

// 3. Test text hierarchy elements
console.log('\n📝 TEXT HIERARCHY:');
const textElements = {
  '.text-header': 'Header text',
  '.text-secondary': 'Secondary text', 
  '.text-interactive': 'Interactive text',
  '.text-success': 'Success text',
  '.text-primary': 'Primary text'
};

Object.entries(textElements).forEach(([selector, description]) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    const style = window.getComputedStyle(elements[0]);
    console.log(`✅ ${description} (${selector}): ${style.color}`);
  } else {
    console.log(`⚠️ ${description} (${selector}): No elements found`);
  }
});

// 4. Test input field elements
console.log('\n📝 INPUT FIELD ELEMENTS:');
const inputFields = document.querySelectorAll('.glass-input-field');
console.log(`Found ${inputFields.length} glass input field elements`);

if (inputFields.length > 0) {
  const firstInput = inputFields[0];
  const inputStyle = window.getComputedStyle(firstInput);
  
  console.log('Input Field Computed Styles:');
  console.log(`- Background: ${inputStyle.background}`);
  console.log(`- Border: ${inputStyle.border}`);
  console.log(`- Color: ${inputStyle.color}`);
  console.log(`- Backdrop Filter: ${inputStyle.backdropFilter}`);
}

// 5. Architecture compliance check
console.log('\n🏗️ ARCHITECTURE COMPLIANCE:');

// Check for !important declarations (should be minimal)
const stylesheets = Array.from(document.styleSheets);
let importantCount = 0;
let classicDarkRules = 0;

try {
  stylesheets.forEach(sheet => {
    if (sheet.href && sheet.href.includes('classic-dark')) {
      Array.from(sheet.cssRules || []).forEach(rule => {
        if (rule.style) {
          classicDarkRules++;
          for (let i = 0; i < rule.style.length; i++) {
            const property = rule.style[i];
            const priority = rule.style.getPropertyPriority(property);
            if (priority === 'important') {
              importantCount++;
            }
          }
        }
      });
    }
  });
} catch (e) {
  console.log('⚠️ Could not analyze stylesheets (CORS restriction)');
}

console.log(`📊 Classic Dark CSS Rules: ${classicDarkRules}`);
console.log(`⚠️ !important declarations: ${importantCount}`);

// 6. File size estimation
console.log('\n📏 FILE SIZE ANALYSIS:');
fetch('/src/styles/themes/classic-dark.css')
  .then(response => response.text())
  .then(css => {
    const lines = css.split('\n').filter(line => line.trim()).length;
    const size = new Blob([css]).size;
    
    console.log(`📄 Lines of CSS: ${lines}`);
    console.log(`💾 File size: ${size} bytes (${(size/1024).toFixed(2)} KB)`);
    
    // Compare with target (should be ~100 lines, significant reduction)
    if (lines <= 120) {
      console.log('✅ File size target achieved (≤120 lines)');
    } else {
      console.log('⚠️ File size above target (>120 lines)');
    }
  })
  .catch(e => console.log('⚠️ Could not fetch CSS file for size analysis'));

console.log('\n🎯 VALIDATION COMPLETE');
console.log('Check above results for architectural compliance with Kyoto/Professional blueprints');
// Diagnose CSS Variable Issues
console.log('🔍 DIAGNOSING CSS VARIABLE ISSUES');
console.log('=================================');

// 1. Check variable values at different scopes
console.log('\n🔧 Variable values at different scopes:');

// Root scope
const rootGlassBg = getComputedStyle(document.documentElement).getPropertyValue('--glass-bg').trim();
const rootGlassBorder = getComputedStyle(document.documentElement).getPropertyValue('--glass-border').trim();
const rootGlassShadow = getComputedStyle(document.documentElement).getPropertyValue('--glass-shadow').trim();

console.log('📍 Root scope (:root):');
console.log(`  --glass-bg: ${rootGlassBg}`);
console.log(`  --glass-border: ${rootGlassBorder}`);
console.log(`  --glass-shadow: ${rootGlassShadow}`);

// Theme scope (should override root)
const htmlElement = document.documentElement;
const themeGlassBg = getComputedStyle(htmlElement).getPropertyValue('--glass-bg').trim();
const themeGlassBorder = getComputedStyle(htmlElement).getPropertyValue('--glass-border').trim();
const themeGlassShadow = getComputedStyle(htmlElement).getPropertyValue('--glass-shadow').trim();

console.log('\n📍 Theme scope (html[data-theme="professional"]):');
console.log(`  --glass-bg: ${themeGlassBg}`);
console.log(`  --glass-border: ${themeGlassBorder}`);
console.log(`  --glass-shadow: ${themeGlassShadow}`);

// 2. Check if theme attribute is set correctly
const themeAttr = document.documentElement.getAttribute('data-theme');
console.log(`\n🎨 Theme attribute: ${themeAttr}`);

// 3. Test on actual glass panel element
const glassPanels = document.querySelectorAll('.glass-panel');
if (glassPanels.length > 0) {
  const panel = glassPanels[0];
  const panelGlassBg = getComputedStyle(panel).getPropertyValue('--glass-bg').trim();
  const panelGlassBorder = getComputedStyle(panel).getPropertyValue('--glass-border').trim();
  const panelGlassShadow = getComputedStyle(panel).getPropertyValue('--glass-shadow').trim();
  
  console.log('\n📍 Glass panel element scope:');
  console.log(`  --glass-bg: ${panelGlassBg}`);
  console.log(`  --glass-border: ${panelGlassBorder}`);
  console.log(`  --glass-shadow: ${panelGlassShadow}`);
  
  // Check computed styles
  const panelStyles = getComputedStyle(panel);
  console.log('\n🎨 Computed panel styles:');
  console.log(`  background: ${panelStyles.background}`);
  console.log(`  border: ${panelStyles.border}`);
  console.log(`  box-shadow: ${panelStyles.boxShadow}`);
}

// 4. Check CSS rule specificity
console.log('\n🏗️ CSS Rule Analysis:');

// Check if our theme rule exists
let foundThemeRule = false;
let foundRootRule = false;

try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      rules.forEach(rule => {
        if (rule.selectorText) {
          if (rule.selectorText.includes('html[data-theme="professional"]') && 
              rule.cssText.includes('--glass-bg')) {
            foundThemeRule = true;
            console.log('✅ Found theme rule:', rule.selectorText);
          }
          if (rule.selectorText === ':root' && rule.cssText.includes('--glass-bg')) {
            foundRootRule = true;
            console.log('✅ Found root rule:', rule.selectorText);
          }
        }
      });
    } catch (e) {
      // Cross-origin issues
    }
  });
} catch (e) {
  console.log('Could not analyze CSS rules');
}

console.log(`Theme rule found: ${foundThemeRule ? '✅' : '❌'}`);
console.log(`Root rule found: ${foundRootRule ? '✅' : '❌'}`);

// 5. Test variable inheritance
console.log('\n🧪 Testing variable inheritance:');

// Create test element
const testDiv = document.createElement('div');
testDiv.style.display = 'none';
document.body.appendChild(testDiv);

const testGlassBg = getComputedStyle(testDiv).getPropertyValue('--glass-bg').trim();
console.log(`Test element --glass-bg: ${testGlassBg}`);

document.body.removeChild(testDiv);

// 6. Expected vs Actual
console.log('\n📊 Expected vs Actual:');
const expected = {
  '--glass-bg': '255, 255, 255',
  '--glass-border': '191, 219, 254',
  '--glass-shadow': '30, 64, 175'
};

const actual = {
  '--glass-bg': themeGlassBg,
  '--glass-border': themeGlassBorder,
  '--glass-shadow': themeGlassShadow
};

Object.keys(expected).forEach(varName => {
  const matches = expected[varName] === actual[varName];
  console.log(`${matches ? '✅' : '❌'} ${varName}: expected "${expected[varName]}", got "${actual[varName]}"`);
});

console.log('\n✅ Diagnosis complete!');
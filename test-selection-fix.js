// Test Text Selection Fix - Verify !important removal worked
console.log('🎨 TESTING TEXT SELECTION FIX');
console.log('=============================');

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Create test text for selection
const testDiv = document.createElement('div');
testDiv.innerHTML = `
  <h3>Header Text Selection Test</h3>
  <p>This is body text for selection testing. Select this text to see the theme-specific selection colors.</p>
  <span class="text-secondary">This is secondary text for selection testing.</span>
`;
testDiv.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  z-index: 10000;
  font-family: system-ui;
  line-height: 1.6;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

document.body.appendChild(testDiv);

// Check selection rules without !important
console.log('\n🔍 Checking selection rules...');
let selectionRules = [];

try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.selectorText && 
            (rule.selectorText.includes('::selection') || rule.selectorText.includes('::-moz-selection'))) {
          selectionRules.push({
            selector: rule.selectorText,
            cssText: rule.cssText,
            hasImportant: rule.cssText.includes('!important')
          });
        }
      });
    } catch (e) {}
  });
} catch (e) {}

console.log(`Found ${selectionRules.length} selection rules`);

// Check for !important declarations
const rulesWithImportant = selectionRules.filter(rule => rule.hasImportant);
const rulesWithoutImportant = selectionRules.filter(rule => !rule.hasImportant);

console.log(`Rules with !important: ${rulesWithImportant.length} ${rulesWithImportant.length === 0 ? '✅' : '❌'}`);
console.log(`Rules without !important: ${rulesWithoutImportant.length} ${rulesWithoutImportant.length > 0 ? '✅' : '❌'}`);

if (rulesWithImportant.length > 0) {
  console.log('\n⚠️ Rules still using !important:');
  rulesWithImportant.forEach(rule => {
    console.log(`  ${rule.selector}: ${rule.cssText}`);
  });
}

// Check theme-specific rules
const themeRules = selectionRules.filter(rule => 
  rule.selector.includes(currentTheme) && rule.selector.includes('::selection')
);

console.log(`\n🎯 Theme-specific rules for "${currentTheme}": ${themeRules.length}`);
themeRules.forEach(rule => {
  console.log(`  ${rule.selector}`);
  console.log(`  CSS: ${rule.cssText}`);
  console.log(`  Has !important: ${rule.hasImportant ? '❌' : '✅'}`);
});

// Expected colors by theme
const expectedColors = {
  professional: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: 'rgb(15, 23, 42)'
  },
  kyoto: {
    background: 'rgba(220, 8, 8, 0.25)',
    color: 'rgb(254, 247, 230)'
  }
};

const expected = expectedColors[currentTheme];
if (expected && themeRules.length > 0) {
  console.log('\n📊 Expected vs Actual:');
  console.log(`Expected background: ${expected.background}`);
  console.log(`Expected color: ${expected.color}`);
  
  const themeRule = themeRules[0];
  const hasCorrectBackground = themeRule.cssText.includes('59, 130, 246') || 
                              themeRule.cssText.includes('220, 8, 8');
  const hasCorrectColor = themeRule.cssText.includes(expected.color);
  
  console.log(`Background correct: ${hasCorrectBackground ? '✅' : '❌'}`);
  console.log(`Color correct: ${hasCorrectColor ? '✅' : '❌'}`);
}

// Instructions
console.log('\n📋 MANUAL TESTING:');
console.log('==================');
console.log('1. Select text in the blue test box (top-right corner)');
console.log('2. You should see:');

if (currentTheme === 'professional') {
  console.log('   • Light blue background');
  console.log('   • Dark navy text');
} else if (currentTheme === 'kyoto') {
  console.log('   • Light red/maple background');
  console.log('   • Light beige text');
}

console.log('3. Test selection in different parts of the app');
console.log('4. Verify selection works consistently');

// Auto-remove test div
setTimeout(() => {
  if (document.body.contains(testDiv)) {
    document.body.removeChild(testDiv);
    console.log('\n🧹 Test box removed');
  }
}, 45000);

console.log('\n✅ Text selection fix test complete!');
console.log('💡 Test box will auto-remove in 45 seconds');

// Final status
const fixSuccessful = rulesWithImportant.length === 0 && themeRules.length > 0;
console.log(`\n🎉 Selection fix successful: ${fixSuccessful ? '✅' : '❌'}`);

if (fixSuccessful) {
  console.log('✅ Global !important declarations removed');
  console.log('✅ Theme-specific selection rules can now work');
  console.log('✅ Clean CSS cascade restored');
}
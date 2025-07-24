// Test Text Selection Styling
console.log('📝 TESTING TEXT SELECTION STYLING');
console.log('=================================');

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Create test text for selection
const testDiv = document.createElement('div');
testDiv.innerHTML = `
  <p>This is test text for selection. Please select this text to test the selection background and color.</p>
  <h3>This is a header for selection testing</h3>
  <span>This is inline text for selection</span>
`;
testDiv.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 8px;
  z-index: 10000;
  font-family: system-ui;
  line-height: 1.5;
`;

document.body.appendChild(testDiv);

// Test selection styles programmatically
console.log('\n🎨 Testing selection styles...');

// Get computed selection styles (this is tricky to test programmatically)
const testElement = document.createElement('div');
testElement.textContent = 'Test selection';
testElement.style.display = 'none';
document.body.appendChild(testElement);

// Check if selection rules exist in stylesheets
let foundSelectionRules = false;
let selectionRules = [];

try {
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.selectorText && 
            (rule.selectorText.includes('::selection') || rule.selectorText.includes('::-moz-selection')) &&
            rule.selectorText.includes(currentTheme)) {
          foundSelectionRules = true;
          selectionRules.push({
            selector: rule.selectorText,
            backgroundColor: rule.style.backgroundColor,
            color: rule.style.color
          });
        }
      });
    } catch (e) {
      // Cross-origin or access issues
    }
  });
} catch (e) {
  console.log('Could not access stylesheets');
}

console.log(`Selection rules found: ${foundSelectionRules ? '✅' : '❌'}`);

if (selectionRules.length > 0) {
  console.log('\n📋 Selection rules:');
  selectionRules.forEach(rule => {
    console.log(`  ${rule.selector}:`);
    console.log(`    Background: ${rule.backgroundColor}`);
    console.log(`    Color: ${rule.color}`);
  });
}

// Expected colors by theme
const expectedColors = {
  professional: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#0f172a'
  },
  kyoto: {
    background: 'rgba(220, 8, 8, 0.25)',
    color: '#fef7e6'
  }
};

const expected = expectedColors[currentTheme];
if (expected) {
  console.log('\n🎯 Expected selection colors:');
  console.log(`  Background: ${expected.background}`);
  console.log(`  Color: ${expected.color}`);
  
  // Check if actual matches expected
  const actualRule = selectionRules.find(rule => rule.selector.includes('::selection'));
  if (actualRule) {
    const backgroundMatch = actualRule.backgroundColor.includes('59, 130, 246') || 
                           actualRule.backgroundColor.includes('220, 8, 8');
    const colorMatch = actualRule.color === expected.color;
    
    console.log(`Background color correct: ${backgroundMatch ? '✅' : '❌'}`);
    console.log(`Text color correct: ${colorMatch ? '✅' : '❌'}`);
  }
}

document.body.removeChild(testElement);

// Instructions for manual testing
console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
console.log('==============================');
console.log('1. Look for the test text box in the top-right corner');
console.log('2. Select some text in the test box');
console.log('3. Verify you see a colored background behind selected text');
console.log('4. Check that text color provides good contrast');

if (currentTheme === 'professional') {
  console.log('5. Expected: Light blue background with dark navy text');
} else if (currentTheme === 'kyoto') {
  console.log('5. Expected: Light red/maple background with light beige text');
}

console.log('6. Test selection in different parts of the application');
console.log('7. Verify selection works in input fields, headers, and body text');

// Auto-remove test div after 30 seconds
setTimeout(() => {
  if (document.body.contains(testDiv)) {
    document.body.removeChild(testDiv);
    console.log('\n🧹 Test text box automatically removed');
  }
}, 30000);

console.log('\n✅ Text selection test setup complete!');
console.log('💡 The test text box will auto-remove in 30 seconds');
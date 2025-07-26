// Classic Dark Theme Integration Test
// Tests theme integration with application components

console.log('🔗 CLASSIC DARK INTEGRATION TEST');
console.log('Testing theme integration with application components');

// Test 1: Theme Activation
console.log('\n1️⃣ THEME ACTIVATION TEST:');

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme === 'classic-dark') {
  console.log('✅ Classic Dark theme is active');
} else {
  console.log('⚠️ Classic Dark theme is not active - switching for test');
  document.documentElement.setAttribute('data-theme', 'classic-dark');
}

// Test 2: Component Integration
console.log('\n2️⃣ COMPONENT INTEGRATION:');

const componentTests = {
  'Glass Panels': '.glass-panel',
  'Input Fields': '.glass-input-field', 
  'Text Headers': '.text-header',
  'Interactive Elements': '.text-interactive',
  'Secondary Text': '.text-secondary',
  'Success Text': '.text-success'
};

Object.entries(componentTests).forEach(([component, selector]) => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    const style = window.getComputedStyle(elements[0]);
    console.log(`✅ ${component}: ${elements.length} elements found`);
    console.log(`   - Color: ${style.color}`);
    console.log(`   - Background: ${style.background || 'none'}`);
  } else {
    console.log(`⚠️ ${component}: No elements found`);
  }
});

// Test 3: Glassmorphism Effects
console.log('\n3️⃣ GLASSMORPHISM EFFECTS:');

const glassPanels = document.querySelectorAll('.glass-panel');
if (glassPanels.length > 0) {
  const panel = glassPanels[0];
  const style = window.getComputedStyle(panel);
  
  const hasBackdropFilter = style.backdropFilter && style.backdropFilter !== 'none';
  const hasWebkitBackdropFilter = style.webkitBackdropFilter && style.webkitBackdropFilter !== 'none';
  const hasBoxShadow = style.boxShadow && style.boxShadow !== 'none';
  const hasBackground = style.background && !style.background.includes('rgba(0, 0, 0, 0)');
  
  console.log(`Backdrop Filter: ${hasBackdropFilter ? '✅' : '❌'} ${style.backdropFilter}`);
  console.log(`Webkit Backdrop Filter: ${hasWebkitBackdropFilter ? '✅' : '❌'} ${style.webkitBackdropFilter}`);
  console.log(`Box Shadow: ${hasBoxShadow ? '✅' : '❌'} ${style.boxShadow}`);
  console.log(`Background: ${hasBackground ? '✅' : '❌'} ${style.background}`);
  
  const effectsWorking = hasBackdropFilter && hasBoxShadow && hasBackground;
  console.log(`\nGlassmorphism Status: ${effectsWorking ? '✅ Working' : '❌ Issues detected'}`);
} else {
  console.log('⚠️ No glass panels found for glassmorphism testing');
}

// Test 4: Hover Interactions
console.log('\n4️⃣ HOVER INTERACTIONS:');

const interactiveElements = document.querySelectorAll('.glass-panel, .glass-input-field');
console.log(`Found ${interactiveElements.length} interactive elements`);

if (interactiveElements.length > 0) {
  const testElement = interactiveElements[0];
  const originalTransform = window.getComputedStyle(testElement).transform;
  const originalBoxShadow = window.getComputedStyle(testElement).boxShadow;
  
  // Simulate hover
  testElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  
  setTimeout(() => {
    const hoverTransform = window.getComputedStyle(testElement).transform;
    const hoverBoxShadow = window.getComputedStyle(testElement).boxShadow;
    
    const transformChanged = hoverTransform !== originalTransform;
    const shadowChanged = hoverBoxShadow !== originalBoxShadow;
    
    console.log(`Transform change: ${transformChanged ? '✅' : '❌'}`);
    console.log(`Shadow change: ${shadowChanged ? '✅' : '❌'}`);
    console.log(`Original transform: ${originalTransform}`);
    console.log(`Hover transform: ${hoverTransform}`);
    
    // Clean up
    testElement.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }, 100);
}

// Test 5: Text Contrast and Accessibility
console.log('\n5️⃣ ACCESSIBILITY TEST:');

const textElements = document.querySelectorAll('.text-header, .text-secondary, .text-interactive, .text-success');
let contrastIssues = 0;

textElements.forEach((element, index) => {
  const style = window.getComputedStyle(element);
  const color = style.color;
  const backgroundColor = style.backgroundColor;
  
  // Simple contrast check (would need more sophisticated algorithm for real testing)
  const hasGoodContrast = !color.includes('rgb(128, 128, 128)'); // Avoid mid-gray
  
  if (!hasGoodContrast) {
    contrastIssues++;
    console.log(`⚠️ Element ${index + 1}: Potential contrast issue - ${color}`);
  } else {
    console.log(`✅ Element ${index + 1}: Good contrast - ${color}`);
  }
});

console.log(`\nContrast Summary: ${contrastIssues} potential issues found`);

// Test 6: CSS Variable Inheritance
console.log('\n6️⃣ CSS VARIABLE INHERITANCE:');

const testVariables = [
  '--theme-text-body',
  '--theme-text-header', 
  '--theme-glass-bg',
  '--theme-glass-border'
];

testVariables.forEach(variable => {
  const rootValue = getComputedStyle(document.documentElement).getPropertyValue(variable);
  const bodyValue = getComputedStyle(document.body).getPropertyValue(variable);
  
  if (rootValue && rootValue.trim()) {
    console.log(`✅ ${variable}: ${rootValue.trim()}`);
    
    if (bodyValue && bodyValue.trim() && bodyValue !== rootValue) {
      console.log(`   ⚠️ Different value in body: ${bodyValue.trim()}`);
    }
  } else {
    console.log(`❌ ${variable}: Not found or empty`);
  }
});

// Test 7: Performance Check
console.log('\n7️⃣ PERFORMANCE CHECK:');

const startTime = performance.now();

// Simulate style recalculation
document.documentElement.style.setProperty('--test-var', 'test');
document.documentElement.style.removeProperty('--test-var');

const endTime = performance.now();
const recalcTime = endTime - startTime;

console.log(`Style recalculation time: ${recalcTime.toFixed(2)}ms`);

if (recalcTime < 5) {
  console.log('✅ Good performance - fast style recalculation');
} else if (recalcTime < 15) {
  console.log('⚠️ Moderate performance - acceptable style recalculation');
} else {
  console.log('❌ Poor performance - slow style recalculation');
}

// Test 8: Theme Consistency
console.log('\n8️⃣ THEME CONSISTENCY:');

// Check if all glass panels have consistent styling
const allGlassPanels = document.querySelectorAll('.glass-panel');
let consistentStyling = true;
let referenceBackground = '';
let referenceBorder = '';

allGlassPanels.forEach((panel, index) => {
  const style = window.getComputedStyle(panel);
  
  if (index === 0) {
    referenceBackground = style.background;
    referenceBorder = style.border;
  } else {
    if (style.background !== referenceBackground) {
      consistentStyling = false;
      console.log(`⚠️ Panel ${index + 1}: Inconsistent background`);
    }
    if (style.border !== referenceBorder) {
      consistentStyling = false;
      console.log(`⚠️ Panel ${index + 1}: Inconsistent border`);
    }
  }
});

console.log(`Theme Consistency: ${consistentStyling ? '✅ All panels styled consistently' : '❌ Styling inconsistencies found'}`);

console.log('\n🏁 INTEGRATION TEST COMPLETE');
console.log('Review results above for theme integration status');
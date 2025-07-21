// Clean Kyoto Hover Fix Test
// This script tests if our clean fix works correctly

console.log('🧪 CLEAN KYOTO HOVER FIX TEST');

// STEP 1: Check if we're in Kyoto theme
console.log('\n📋 STEP 1: VERIFYING THEME');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 2: Find input panels
console.log('\n📋 STEP 2: FINDING INPUT PANELS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// STEP 3: Check CSS rules
console.log('\n📋 STEP 3: CHECKING CSS RULES');

function findCSSRules(selector) {
  const matchingRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && rule.selectorText.includes(selector)) {
          matchingRules.push({
            selector: rule.selectorText,
            boxShadow: rule.style.boxShadow,
            transform: rule.style.transform,
            borderColor: rule.style.borderColor,
            important: {
              boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
              transform: rule.style.getPropertyPriority('transform') === 'important',
              borderColor: rule.style.getPropertyPriority('border-color') === 'important'
            },
            source: sheet.href || 'inline'
          });
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  return matchingRules;
}

// Find the problematic rule
const kyotoGlassPanelRules = findCSSRules('[data-theme="kyoto"] .glass-panel');
console.log(`Found ${kyotoGlassPanelRules.length} [data-theme="kyoto"] .glass-panel rules`);

// Check if the problematic rule still has !important declarations
const problematicRules = kyotoGlassPanelRules.filter(rule => 
  rule.important.boxShadow || rule.important.transform || rule.important.borderColor
);

console.log(`Found ${problematicRules.length} problematic rules with !important declarations`);
if (problematicRules.length > 0) {
  console.warn('⚠️ Still using !important declarations in problematic rules:');
  problematicRules.forEach((rule, i) => {
    console.log(`${i + 1}. ${rule.selector}`);
    if (rule.important.boxShadow) console.log(`   - Box-shadow: ${rule.boxShadow} !important`);
    if (rule.important.transform) console.log(`   - Transform: ${rule.transform} !important`);
    if (rule.important.borderColor) console.log(`   - Border-color: ${rule.borderColor} !important`);
  });
} else {
  console.log('✅ No !important declarations in problematic rules - good!');
}

// Find hover rules
const hoverRules = findCSSRules('hover');
const kyotoHoverRules = hoverRules.filter(rule => rule.selector.includes('kyoto'));
console.log(`\nFound ${kyotoHoverRules.length} Kyoto hover rules`);

// Check for !important declarations in hover rules
const importantHoverRules = kyotoHoverRules.filter(rule => 
  rule.important.boxShadow || rule.important.transform || rule.important.borderColor
);

console.log(`Found ${importantHoverRules.length} hover rules with !important declarations`);
if (importantHoverRules.length > 0) {
  console.warn('⚠️ Still using !important declarations in hover rules:');
  importantHoverRules.forEach((rule, i) => {
    console.log(`${i + 1}. ${rule.selector}`);
    if (rule.important.boxShadow) console.log(`   - Box-shadow: ${rule.boxShadow} !important`);
    if (rule.important.transform) console.log(`   - Transform: ${rule.transform} !important`);
    if (rule.important.borderColor) console.log(`   - Border-color: ${rule.borderColor} !important`);
  });
} else {
  console.log('✅ No !important declarations in hover rules - good!');
}

// STEP 4: Check default styles
console.log('\n📋 STEP 4: CHECKING DEFAULT STYLES');
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  console.log('- Classes:', panel.className);
  
  const computedStyle = getComputedStyle(panel);
  console.log('- Default box-shadow:', computedStyle.boxShadow);
  console.log('- Default transform:', computedStyle.transform);
  console.log('- Default border-color:', computedStyle.borderColor);
});

// STEP 5: Test hover effect
console.log('\n📋 STEP 5: TESTING HOVER EFFECT');
console.log('Please hover over an input panel now...');

let hoverTestActive = true;
const hoverInterval = setInterval(() => {
  if (!hoverTestActive) return;
  
  for (let i = 0; i < inputPanels.length; i++) {
    const panel = inputPanels[i];
    const isHovered = panel.matches(':hover');
    
    if (isHovered) {
      console.log(`🖱️ HOVER DETECTED on panel ${i + 1}!`);
      
      const computedStyle = getComputedStyle(panel);
      console.log('Hover computed styles:');
      console.log('- Box-shadow:', computedStyle.boxShadow);
      console.log('- Transform:', computedStyle.transform);
      console.log('- Border-color:', computedStyle.borderColor);
      
      // Check if our hover fix is working
      const isStrongShadow = computedStyle.boxShadow.includes('80px') || 
                            computedStyle.boxShadow.includes('64px') ||
                            computedStyle.boxShadow.includes('0.7');
      
      const hasTransform = computedStyle.transform.includes('matrix');
      
      if (isStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Hover fix is working correctly!');
        console.log('Strong shadow and transform are applied without !important declarations.');
      } else {
        console.log('❌ FAILURE! Hover fix is not working correctly.');
        console.log('Expected strong shadow and transform, but they\'re not being applied.');
      }
      
      hoverTestActive = false;
      break;
    }
  }
}, 100);

// Auto-stop after 30 seconds
setTimeout(() => {
  hoverTestActive = false;
  clearInterval(hoverInterval);
  console.log('\n⏰ Hover test completed (30s timeout)');
}, 30000);

// STEP 6: Test hover-from-handle class
console.log('\n📋 STEP 6: TESTING HOVER-FROM-HANDLE CLASS');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Adding hover-from-handle class to first panel...');
  
  // Save original class
  const originalClass = testPanel.className;
  
  // Add hover-from-handle class
  testPanel.className = `${originalClass} hover-from-handle`;
  
  // Check the computed styles after adding the class
  setTimeout(() => {
    const handleHoverStyle = getComputedStyle(testPanel);
    console.log('\nHover-from-handle computed styles:');
    console.log('- Box-shadow:', handleHoverStyle.boxShadow);
    console.log('- Transform:', handleHoverStyle.transform);
    console.log('- Border-color:', handleHoverStyle.borderColor);
    
    // Check if our hover fix is working for hover-from-handle
    const isStrongShadow = handleHoverStyle.boxShadow.includes('80px') || 
                          handleHoverStyle.boxShadow.includes('64px') ||
                          handleHoverStyle.boxShadow.includes('0.7');
    
    const hasTransform = handleHoverStyle.transform.includes('matrix');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Hover-from-handle is working correctly!');
      console.log('Strong shadow and transform are applied without !important declarations.');
    } else {
      console.log('❌ FAILURE! Hover-from-handle is not working correctly.');
      console.log('Expected strong shadow and transform, but they\'re not being applied.');
    }
    
    // Restore original class
    testPanel.className = originalClass;
    console.log('\n🧹 Hover-from-handle class removed');
  }, 1000);
}

// STEP 7: Test force-hover class
console.log('\n📋 STEP 7: TESTING FORCE-HOVER CLASS');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Adding force-hover class to first panel...');
  
  // Save original class
  const originalClass = testPanel.className;
  
  // Add force-hover class
  testPanel.className = `${originalClass} force-hover`;
  
  // Check the computed styles after adding the class
  setTimeout(() => {
    const forceHoverStyle = getComputedStyle(testPanel);
    console.log('\nForce-hover computed styles:');
    console.log('- Box-shadow:', forceHoverStyle.boxShadow);
    console.log('- Transform:', forceHoverStyle.transform);
    console.log('- Border-color:', forceHoverStyle.borderColor);
    
    // Check if our hover fix is working for force-hover
    const isStrongShadow = forceHoverStyle.boxShadow.includes('80px') || 
                          forceHoverStyle.boxShadow.includes('64px') ||
                          forceHoverStyle.boxShadow.includes('0.7');
    
    const hasTransform = forceHoverStyle.transform.includes('matrix');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Force-hover is working correctly!');
      console.log('Strong shadow and transform are applied without !important declarations.');
    } else {
      console.log('❌ FAILURE! Force-hover is not working correctly.');
      console.log('Expected strong shadow and transform, but they\'re not being applied.');
    }
    
    // Restore original class
    testPanel.className = originalClass;
    console.log('\n🧹 Force-hover class removed');
  }, 2000);
}

console.log('\n⏰ Test will run for 30 seconds');
console.log('🖱️ Please hover over input panels during this time to test the hover effect');
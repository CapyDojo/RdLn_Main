// Clean CSS Hierarchy Final Test
// This script tests if our clean CSS hierarchy works correctly without !important declarations

console.log('🧪 CLEAN CSS HIERARCHY FINAL TEST');

// STEP 1: Verify that the nuclear fix is disabled
console.log('\n📋 STEP 1: VERIFYING NUCLEAR FIX IS DISABLED');
const nuclearFix = document.getElementById('nuclear-kyoto-hover-fix');
console.log('Nuclear fix element exists:', !!nuclearFix);

if (nuclearFix) {
  console.warn('⚠️ Nuclear fix is still active! This should not happen.');
  console.log('Nuclear fix content:', nuclearFix.textContent);
}

// STEP 2: Check if we're in Kyoto theme
console.log('\n📋 STEP 2: VERIFYING THEME');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 3: Find input panels
console.log('\n📋 STEP 3: FINDING INPUT PANELS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// STEP 4: Check CSS rules
console.log('\n📋 STEP 4: CHECKING CSS RULES');

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

const kyotoHoverRules = findCSSRules('kyoto') && findCSSRules('hover');
console.log(`Found ${kyotoHoverRules.length} Kyoto hover rules:`);

// Check for !important declarations
const importantRules = kyotoHoverRules.filter(rule => 
  rule.important.boxShadow || rule.important.transform || rule.important.borderColor
);

console.log(`Found ${importantRules.length} rules with !important declarations:`);
importantRules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector}`);
  if (rule.important.boxShadow) console.log(`   Box-shadow: ${rule.boxShadow} !important`);
  if (rule.important.transform) console.log(`   Transform: ${rule.transform} !important`);
  if (rule.important.borderColor) console.log(`   Border-color: ${rule.borderColor} !important`);
});

// STEP 5: Check default styles
console.log('\n📋 STEP 5: CHECKING DEFAULT STYLES');
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  console.log('- Classes:', panel.className);
  
  const computedStyle = getComputedStyle(panel);
  console.log('- Default box-shadow:', computedStyle.boxShadow);
  console.log('- Default transform:', computedStyle.transform);
  console.log('- Default border-color:', computedStyle.borderColor);
});

// STEP 6: Test hover effect
console.log('\n📋 STEP 6: TESTING HOVER EFFECT');
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
      
      // Check if our clean hierarchy is working
      const isStrongShadow = computedStyle.boxShadow.includes('80px') || 
                            computedStyle.boxShadow.includes('64px') ||
                            computedStyle.boxShadow.includes('0.7');
      
      const hasTransform = computedStyle.transform.includes('matrix');
      
      if (isStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Clean CSS hierarchy is working correctly!');
        console.log('Strong shadow and transform are applied without !important declarations.');
      } else {
        console.log('❌ FAILURE! Clean CSS hierarchy is not working correctly.');
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

console.log('\n⏰ Test will run for 30 seconds');
console.log('🖱️ Please hover over input panels during this time to test the hover effect');
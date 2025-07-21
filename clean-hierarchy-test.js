// Clean CSS Hierarchy Test Script
// This script verifies that our clean CSS hierarchy works correctly without !important declarations

console.log('🧪 TESTING CLEAN CSS HIERARCHY');

// STEP 1: Verify that the nuclear fix is disabled
console.log('\n📋 STEP 1: VERIFYING NUCLEAR FIX IS DISABLED');
const nuclearFix = document.getElementById('nuclear-kyoto-hover-fix');
console.log('Nuclear fix element exists:', !!nuclearFix);

if (nuclearFix) {
  console.warn('⚠️ Nuclear fix is still active! Disabling it for clean test...');
  nuclearFix.parentNode.removeChild(nuclearFix);
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

if (inputPanels.length === 0) {
  console.error('❌ No input panels found! Make sure you\'re on the comparison page.');
}

// STEP 4: Check computed styles
console.log('\n📋 STEP 4: CHECKING COMPUTED STYLES');
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
console.log('Hover over an input panel now to see if the clean CSS hierarchy works...');

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
      
      const hasTransform = computedStyle.transform.includes('translateY');
      
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
  console.log('If you didn\'t hover over a panel, please try again.');
}, 30000);

console.log('\n⏰ Hover test will run for 30 seconds');
console.log('🖱️ Hover over input panels during this time to test the clean CSS hierarchy');
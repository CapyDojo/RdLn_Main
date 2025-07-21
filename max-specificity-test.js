// Maximum Specificity Test Script
// This script tests if our maximum specificity solution is working correctly

console.log('🔬 MAXIMUM SPECIFICITY TEST');

// STEP 1: Environment check
console.log('\n📋 STEP 1: ENVIRONMENT CHECK');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 2: Find input panels
console.log('\n📋 STEP 2: FINDING INPUT PANELS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// STEP 3: Check default styles
console.log('\n📋 STEP 3: CHECKING DEFAULT STYLES');
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  console.log('- Classes:', panel.className);
  
  const computedStyle = getComputedStyle(panel);
  console.log('- Default box-shadow:', computedStyle.boxShadow);
  console.log('- Default transform:', computedStyle.transform);
  console.log('- Default border-color:', computedStyle.borderColor);
});

// STEP 4: Force hover state on first panel
console.log('\n📋 STEP 4: FORCING HOVER STATE');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Forcing hover state on first panel...');
  
  // Apply hover styles directly to the element
  testPanel.style.boxShadow = '0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5)';
  testPanel.style.borderColor = 'rgba(220, 8, 8, 0.6)';
  testPanel.style.transform = 'translateY(-2px)';
  testPanel.style.background = 'rgba(28, 25, 23, 0.2)';
  
  // Check the computed styles after applying the hover styles
  setTimeout(() => {
    const hoverComputedStyle = getComputedStyle(testPanel);
    console.log('\nForced hover computed styles:');
    console.log('- Box-shadow:', hoverComputedStyle.boxShadow);
    console.log('- Transform:', hoverComputedStyle.transform);
    console.log('- Border-color:', hoverComputedStyle.borderColor);
    
    // Check if our styles are applied
    const isStrongShadow = hoverComputedStyle.boxShadow.includes('80px') || 
                          hoverComputedStyle.boxShadow.includes('0.7');
    
    const hasTransform = hoverComputedStyle.transform.includes('matrix');
    
    if (isStrongShadow && hasTransform) {
      console.log('✅ SUCCESS! Inline styles are working correctly!');
      console.log('This confirms that inline styles can override any CSS rules.');
    } else {
      console.log('❌ FAILURE! Inline styles are not working correctly.');
      console.log('This suggests there might be something else overriding even inline styles.');
    }
    
    // Clean up
    testPanel.style.boxShadow = '';
    testPanel.style.borderColor = '';
    testPanel.style.transform = '';
    testPanel.style.background = '';
    console.log('\n🧹 Inline styles removed');
  }, 1000);
}

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
      
      // Check if our maximum specificity solution is working
      const isStrongShadow = computedStyle.boxShadow.includes('80px') || 
                            computedStyle.boxShadow.includes('0.7');
      
      const hasTransform = computedStyle.transform.includes('matrix');
      
      if (isStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Maximum specificity solution is working correctly!');
        console.log('Strong shadow and transform are applied with !important declarations.');
      } else {
        console.log('❌ FAILURE! Maximum specificity solution is not working correctly.');
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
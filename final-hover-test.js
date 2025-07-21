// Final Hover Test Script
// This script provides a comprehensive test of the Kyoto theme hover effects

console.log('🔬 FINAL KYOTO HOVER TEST');

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

const kyotoHoverRules = findCSSRules('kyoto') && findCSSRules('hover');
console.log(`Found ${kyotoHoverRules.length} Kyoto hover rules:`);

kyotoHoverRules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector}`);
  console.log(`   Box-shadow: ${rule.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
  console.log(`   Transform: ${rule.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
  console.log(`   Border-color: ${rule.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
});

// STEP 4: Check default styles
console.log('\n📋 STEP 4: CHECKING DEFAULT STYLES');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const computedStyle = getComputedStyle(testPanel);
  
  console.log('Default computed styles:');
  console.log('- Box-shadow:', computedStyle.boxShadow);
  console.log('- Transform:', computedStyle.transform);
  console.log('- Border-color:', computedStyle.borderColor);
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
}, 30000);

// STEP 6: Simulate hover effect
console.log('\n📋 STEP 6: SIMULATING HOVER EFFECT');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Simulating hover on first panel...');
  
  // Create a test style to simulate hover
  const hoverTestStyle = document.createElement('style');
  hoverTestStyle.id = 'hover-test-style';
  hoverTestStyle.textContent = `
    /* Force hover state on first panel */
    [data-input-panel] .glass-panel.glass-content-panel:first-of-type {
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
      border-color: rgba(220, 8, 8, 0.6) !important;
      transform: translateY(-2px) !important;
      background: rgba(28, 25, 23, var(--glass-focus)) !important;
    }
  `;
  document.head.appendChild(hoverTestStyle);
  
  // Check the computed styles after applying the hover simulation
  setTimeout(() => {
    const hoverComputedStyle = getComputedStyle(testPanel);
    console.log('\nSimulated hover computed styles:');
    console.log('- Box-shadow:', hoverComputedStyle.boxShadow);
    console.log('- Transform:', hoverComputedStyle.transform);
    console.log('- Border-color:', hoverComputedStyle.borderColor);
    
    // Clean up
    document.head.removeChild(hoverTestStyle);
    console.log('\n🧹 Test style removed');
  }, 1000);
}

console.log('\n⏰ Test will run for 30 seconds');
console.log('🖱️ Please hover over input panels during this time to test the hover effect');
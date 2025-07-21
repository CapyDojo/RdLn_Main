// FINAL CSS OVERRIDE INVESTIGATION - Find the exact source preventing our hover styles
console.log('🔬 FINAL CSS OVERRIDE INVESTIGATION - FINDING THE TRUE ROOT CAUSE');
console.log('Goal: Find why even !important rules don\'t work for hover styles');

// STEP 1: Check for inline styles that override everything
console.log('\n📌 STEP 1: INLINE STYLES INVESTIGATION');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  console.log('- Has inline style attribute:', panel.hasAttribute('style'));
  if (panel.hasAttribute('style')) {
    console.log('- Inline styles:', panel.getAttribute('style'));
    // Check if any inline styles are affecting our properties
    const inlineStyle = panel.style;
    console.log('- Inline box-shadow:', inlineStyle.boxShadow || 'none');
    console.log('- Inline transform:', inlineStyle.transform || 'none');
    console.log('- Inline border-color:', inlineStyle.borderColor || 'none');
    console.log('- Inline background:', inlineStyle.background || 'none');
  }
});

// STEP 2: Check for CSS rules with !important that might be overriding
console.log('\n📌 STEP 2: !IMPORTANT RULES ANALYSIS');
const allRules = Array.from(document.styleSheets)
  .flatMap(sheet => {
    try {
      return Array.from(sheet.cssRules || []);
    } catch (e) {
      return [];
    }
  })
  .filter(rule => rule.selectorText && rule.style);

// Find rules with !important declarations that affect our properties
const importantRules = allRules.filter(rule => 
  rule.style.getPropertyPriority('box-shadow') === 'important' ||
  rule.style.getPropertyPriority('transform') === 'important' ||
  rule.style.getPropertyPriority('border-color') === 'important' ||
  rule.style.getPropertyPriority('background') === 'important'
);

console.log(`Found ${importantRules.length} rules with !important declarations:`);
importantRules.forEach((rule, i) => {
  console.log(`${i + 1}. ${rule.selectorText}`);
  if (rule.style.getPropertyPriority('box-shadow') === 'important') {
    console.log(`   Box-shadow: ${rule.style.boxShadow} !important`);
  }
  if (rule.style.getPropertyPriority('transform') === 'important') {
    console.log(`   Transform: ${rule.style.transform} !important`);
  }
  if (rule.style.getPropertyPriority('border-color') === 'important') {
    console.log(`   Border-color: ${rule.style.borderColor} !important`);
  }
  if (rule.style.getPropertyPriority('background') === 'important') {
    console.log(`   Background: ${rule.style.background} !important`);
  }
});

// STEP 3: Check for rules that might be overriding hover specifically
console.log('\n📌 STEP 3: HOVER OVERRIDE ANALYSIS');
const hoverRules = allRules.filter(rule => 
  rule.selectorText && rule.selectorText.includes(':hover')
);

console.log(`Found ${hoverRules.length} total hover rules`);

// Filter for rules that could affect our glass panels
const relevantHoverRules = hoverRules.filter(rule => {
  const selector = rule.selectorText.toLowerCase();
  return selector.includes('glass') || 
         selector.includes('panel') || 
         selector.includes('shadow') ||
         selector.includes('input');
});

console.log(`${relevantHoverRules.length} hover rules could affect our panels:`);
relevantHoverRules.forEach((rule, i) => {
  console.log(`${i + 1}. ${rule.selectorText}`);
  console.log(`   Box-shadow: ${rule.style.boxShadow || 'none'}`);
  console.log(`   Transform: ${rule.style.transform || 'none'}`);
  console.log(`   Important: box-shadow=${rule.style.getPropertyPriority('box-shadow') === 'important'}, transform=${rule.style.getPropertyPriority('transform') === 'important'}`);
});

// STEP 4: Test if our elements actually match our intended selectors
console.log('\n📌 STEP 4: SELECTOR MATCHING VERIFICATION');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  const testSelectors = [
    '[data-theme="kyoto"] .glass-panel:hover',
    '[data-theme="kyoto"] .glass-panel.glass-content-panel:hover',
    '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover',
    'html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover'
  ];
  
  testSelectors.forEach(selector => {
    try {
      const baseSelector = selector.replace(':hover', '');
      const matches = testPanel.matches(baseSelector);
      console.log(`Panel matches "${baseSelector}": ${matches}`);
    } catch (e) {
      console.log(`Invalid selector "${selector}": ${e.message}`);
    }
  });
}

// STEP 5: Check for JavaScript event listeners that might be interfering
console.log('\n📌 STEP 5: JAVASCRIPT INTERFERENCE CHECK');
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Check for common event listeners
  const events = ['mouseenter', 'mouseleave', 'mouseover', 'mouseout', 'hover'];
  console.log('Checking for event listeners that might interfere with hover...');
  
  // We can't directly inspect all event listeners, but we can check for common patterns
  console.log('Note: Cannot directly inspect all event listeners due to browser security');
  console.log('Check if any JavaScript is modifying styles during hover events');
}

// STEP 6: Nuclear specificity test with maximum possible specificity
console.log('\n📌 STEP 6: NUCLEAR SPECIFICITY TEST');
const nuclearTestStyle = document.createElement('style');
nuclearTestStyle.id = 'nuclear-specificity-test';

// Create the most specific selector possible
const maxSpecificitySelector = `html[data-theme="kyoto"] body div[data-input-panel] .glass-panel.glass-content-panel.shadow-lg.transition-all.duration-300.overflow-hidden:hover`;

nuclearTestStyle.textContent = `
  ${maxSpecificitySelector} {
    box-shadow: 0 50px 100px 0 rgba(255, 0, 0, 0.9), 0 20px 60px 0 rgba(255, 0, 0, 0.7) !important;
    border-color: rgba(255, 0, 0, 0.8) !important;
    transform: translateY(-5px) scale(1.02) !important;
    background: rgba(255, 0, 0, 0.1) !important;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
`;

document.head.appendChild(nuclearTestStyle);
console.log('✅ Nuclear specificity test rule added with maximum specificity');
console.log('Selector used:', maxSpecificitySelector);
console.log('Try hovering over input panels now - they should show BRIGHT RED effects if this works');

// Test if our elements match this nuclear selector
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const baseNuclearSelector = maxSpecificitySelector.replace(':hover', '');
  const matchesNuclear = testPanel.matches(baseNuclearSelector);
  console.log(`Panel matches nuclear selector: ${matchesNuclear}`);
}

// STEP 7: Check for CSS variables that might be affecting styles
console.log('\n📌 STEP 7: CSS VARIABLES INVESTIGATION');
const rootStyle = getComputedStyle(document.documentElement);
const relevantVars = [
  '--glass-panel',
  '--glass-focus',
  '--glass-subtle',
  '--glass-strong',
  '--theme-glass-panel-hover-rgb',
  '--theme-glass-panel-hover-border-rgb',
  '--theme-glass-panel-hover-shadow-rgb'
];

console.log('CSS variables that might affect hover styles:');
relevantVars.forEach(varName => {
  const value = rootStyle.getPropertyValue(varName);
  console.log(`${varName}: ${value || 'not defined'}`);
});

// STEP 8: Check for Tailwind CSS conflicts
console.log('\n📌 STEP 8: TAILWIND CSS CONFLICT ANALYSIS');
// Check what Tailwind's shadow-lg actually computes to
const testElement = document.createElement('div');
testElement.className = 'shadow-lg';
document.body.appendChild(testElement);

const tailwindShadow = getComputedStyle(testElement).boxShadow;
console.log('Tailwind shadow-lg computes to:', tailwindShadow);

// Check if there are any Tailwind hover utilities that might conflict
testElement.className = 'shadow-lg hover:shadow-xl';
const tailwindHoverShadow = getComputedStyle(testElement).boxShadow;
console.log('Tailwind shadow-lg hover:shadow-xl computes to:', tailwindHoverShadow);

document.body.removeChild(testElement);

// STEP 9: Live hover detection with real-time analysis
console.log('\n📌 STEP 9: LIVE HOVER DETECTION');
console.log('Hover over an input panel now for real-time analysis...');

let hoverTestActive = true;
const hoverInterval = setInterval(() => {
  if (!hoverTestActive) return;
  
  for (let i = 0; i < inputPanels.length; i++) {
    const panel = inputPanels[i];
    const isHovered = panel.matches(':hover');
    
    if (isHovered) {
      console.log(`🖱️ HOVER DETECTED on panel ${i + 1}!`);
      
      const computedStyle = getComputedStyle(panel);
      console.log('Real-time computed styles during hover:');
      console.log('- Box-shadow:', computedStyle.boxShadow);
      console.log('- Transform:', computedStyle.transform);
      console.log('- Border-color:', computedStyle.borderColor);
      console.log('- Background:', computedStyle.background);
      
      // Check which CSS rules are actually being applied during hover
      const applicableRules = [];
      
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (const rule of rules) {
            if (rule.selectorText && rule.selectorText.includes(':hover')) {
              try {
                const baseSelector = rule.selectorText.replace(':hover', '');
                if (panel.matches(baseSelector)) {
                  applicableRules.push({
                    selector: rule.selectorText,
                    boxShadow: rule.style.boxShadow,
                    transform: rule.style.transform,
                    important: {
                      boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
                      transform: rule.style.getPropertyPriority('transform') === 'important'
                    }
                  });
                }
              } catch (e) {
                // Skip invalid selectors
              }
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      
      console.log(`${applicableRules.length} hover rules should be applying:`);
      applicableRules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.selector}`);
        console.log(`   Should apply box-shadow: ${rule.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
        console.log(`   Should apply transform: ${rule.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
      });
      
      // Check if the nuclear test is working
      const nuclearWorking = computedStyle.boxShadow.includes('255, 0, 0') || 
                            computedStyle.transform.includes('scale') ||
                            computedStyle.borderColor.includes('255, 0, 0');
      
      console.log(`Nuclear test working: ${nuclearWorking}`);
      
      if (!nuclearWorking) {
        console.log('🚨 CRITICAL: Even nuclear specificity test is not working!');
        console.log('This suggests inline styles or JavaScript is overriding everything');
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
  
  // Clean up nuclear test
  if (document.getElementById('nuclear-specificity-test')) {
    document.head.removeChild(document.getElementById('nuclear-specificity-test'));
    console.log('🧹 Nuclear test styles cleaned up');
  }
  
  console.log('\n🎯 FINAL INVESTIGATION COMPLETE');
  console.log('⏰ Investigation auto-completed (30s timeout)');
  
  console.log('\n📋 SUMMARY - CHECK THESE FINDINGS:');
  console.log('1. Inline styles on panels (Step 1)');
  console.log('2. !important rules that might override (Step 2)');
  console.log('3. Conflicting hover rules (Step 3)');
  console.log('4. Selector matching issues (Step 4)');
  console.log('5. JavaScript interference (Step 5)');
  console.log('6. Nuclear specificity test results (Step 6)');
  console.log('7. CSS variable issues (Step 7)');
  console.log('8. Tailwind conflicts (Step 8)');
  console.log('9. Live hover detection results (Step 9)');
  
  console.log('\n🔍 NEXT STEPS:');
  console.log('- If nuclear test worked: We have a specificity issue');
  console.log('- If nuclear test failed: We have inline styles or JS interference');
  console.log('- Check the live hover detection for the exact override source');
  
}, 30000);

console.log('\n⏰ Investigation will run for 30 seconds');
console.log('🖱️ Hover over input panels during this time for live analysis');
console.log('🔬 This will identify the exact source of the CSS override');
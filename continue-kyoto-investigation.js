// Continue Kyoto Theme CSS Override Investigation
// Based on previous context - finding what's preventing hover styles from working

console.log('🔬 CONTINUING KYOTO THEME HOVER INVESTIGATION');
console.log('Previous context: We have hover styles defined but they\'re not applying');

// STEP 1: Verify current theme and elements
console.log('\n📌 STEP 1: ENVIRONMENT VERIFICATION');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
  console.warn('⚠️ Not in Kyoto theme! Switch to Kyoto theme to test hover effects.');
  console.log('Current theme is:', currentTheme);
}

// Find target elements
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log('Found input panels:', inputPanels.length);

if (inputPanels.length === 0) {
  console.error('❌ No input panels found! Make sure you\'re on the comparison page.');
  console.log('Looking for: [data-input-panel] .glass-panel.glass-content-panel');
}

// STEP 2: Check if our CSS rules exist
console.log('\n📌 STEP 2: CSS RULES EXISTENCE CHECK');

function findHoverRules() {
  const hoverRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && rule.selectorText.includes(':hover')) {
          // Check if it's related to our elements
          if (rule.selectorText.includes('glass-panel') || 
              rule.selectorText.includes('input-panel') ||
              rule.selectorText.includes('kyoto')) {
            hoverRules.push({
              selector: rule.selectorText,
              cssText: rule.cssText,
              boxShadow: rule.style.boxShadow,
              transform: rule.style.transform,
              borderColor: rule.style.borderColor,
              sheet: sheet.href || 'inline'
            });
          }
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  return hoverRules;
}

const hoverRules = findHoverRules();
console.log(`Found ${hoverRules.length} hover rules related to our elements:`);
hoverRules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector}`);
  console.log(`   Box-shadow: ${rule.boxShadow || 'none'}`);
  console.log(`   Transform: ${rule.transform || 'none'}`);
  console.log(`   Border-color: ${rule.borderColor || 'none'}`);
  console.log(`   Source: ${rule.sheet}`);
});

// STEP 3: Test selector specificity and matching
console.log('\n📌 STEP 3: SELECTOR MATCHING TEST');

const testSelectors = [
  '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover',
  '[data-theme="kyoto"][data-input-panel] .glass-panel.glass-content-panel:hover',
  '.glass-panel.glass-content-panel:hover',
  '[data-input-panel] .glass-panel:hover',
  '.glass-panel:hover'
];

testSelectors.forEach(selector => {
  try {
    const baseSelector = selector.replace(':hover', '');
    const matches = document.querySelectorAll(baseSelector).length;
    console.log(`${selector.replace(':hover', '')} matches: ${matches} elements`);
  } catch (e) {
    console.log(`${selector}: Invalid selector`);
  }
});

// STEP 4: Check for conflicting CSS rules
console.log('\n📌 STEP 4: CONFLICTING RULES ANALYSIS');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  
  // Get all rules that apply to this element
  function getAllApplicableRules(element) {
    const applicableRules = [];
    
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule.selectorText) {
            try {
              if (element.matches(rule.selectorText)) {
                applicableRules.push({
                  selector: rule.selectorText,
                  cssText: rule.cssText,
                  boxShadow: rule.style.boxShadow,
                  transform: rule.style.transform,
                  borderColor: rule.style.borderColor,
                  background: rule.style.background,
                  important: {
                    boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
                    transform: rule.style.getPropertyPriority('transform') === 'important',
                    borderColor: rule.style.getPropertyPriority('border-color') === 'important'
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
    
    return applicableRules;
  }
  
  const applicableRules = getAllApplicableRules(testPanel);
  console.log(`Found ${applicableRules.length} rules that apply to test panel:`);
  
  // Filter for rules that affect our hover properties
  const conflictingRules = applicableRules.filter(rule => 
    rule.boxShadow || rule.transform || rule.borderColor || rule.background
  );
  
  console.log(`${conflictingRules.length} rules affect hover properties:`);
  conflictingRules.forEach((rule, index) => {
    console.log(`${index + 1}. ${rule.selector}`);
    if (rule.boxShadow) console.log(`   Box-shadow: ${rule.boxShadow} ${rule.important.boxShadow ? '!important' : ''}`);
    if (rule.transform) console.log(`   Transform: ${rule.transform} ${rule.important.transform ? '!important' : ''}`);
    if (rule.borderColor) console.log(`   Border-color: ${rule.borderColor} ${rule.important.borderColor ? '!important' : ''}`);
    if (rule.background) console.log(`   Background: ${rule.background}`);
  });
}

// STEP 5: Live hover detection test
console.log('\n📌 STEP 5: LIVE HOVER DETECTION TEST');
console.log('Hover over an input panel now to see real-time analysis...');

if (inputPanels.length > 0) {
  let isTestingHover = true;
  
  const hoverTestInterval = setInterval(() => {
    if (!isTestingHover) return;
    
    for (let i = 0; i < inputPanels.length; i++) {
      const panel = inputPanels[i];
      const isHovered = panel.matches(':hover');
      
      if (isHovered) {
        console.log(`🖱️ HOVER DETECTED on panel ${i + 1}!`);
        
        const computedStyle = getComputedStyle(panel);
        console.log('Current computed styles during hover:');
        console.log('- Box-shadow:', computedStyle.boxShadow);
        console.log('- Transform:', computedStyle.transform);
        console.log('- Border-color:', computedStyle.borderColor);
        console.log('- Background:', computedStyle.background);
        
        // Check if any hover rules are actually being applied
        const activeHoverRules = hoverRules.filter(rule => {
          try {
            return panel.matches(rule.selector.replace(':hover', ''));
          } catch (e) {
            return false;
          }
        });
        
        console.log(`${activeHoverRules.length} hover rules should be active:`);
        activeHoverRules.forEach((rule, index) => {
          console.log(`${index + 1}. ${rule.selector}`);
          console.log(`   Should apply box-shadow: ${rule.boxShadow || 'none'}`);
        });
        
        // Stop testing after first hover detection
        isTestingHover = false;
        break;
      }
    }
  }, 100);
  
  // Auto-stop after 30 seconds
  setTimeout(() => {
    isTestingHover = false;
    clearInterval(hoverTestInterval);
    console.log('⏰ Hover test completed (30s timeout)');
  }, 30000);
}

// STEP 6: Nuclear test - inject maximum specificity rule
console.log('\n📌 STEP 6: NUCLEAR SPECIFICITY TEST');

const nuclearTestStyle = document.createElement('style');
nuclearTestStyle.id = 'nuclear-hover-test';
nuclearTestStyle.textContent = `
  html[data-theme="kyoto"] body [data-input-panel] .glass-panel.glass-content-panel.shadow-lg:hover {
    box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
    border-color: rgba(220, 8, 8, 0.6) !important;
    transform: translateY(-2px) !important;
    background: rgba(28, 25, 23, 0.20) !important;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
`;

document.head.appendChild(nuclearTestStyle);
console.log('✅ Nuclear specificity hover rule injected');
console.log('Try hovering over input panels now - they should show strong red shadows');

// Clean up after 60 seconds
setTimeout(() => {
  if (document.getElementById('nuclear-hover-test')) {
    document.head.removeChild(document.getElementById('nuclear-hover-test'));
    console.log('🧹 Nuclear test styles cleaned up');
  }
}, 60000);

console.log('\n🎯 INVESTIGATION SUMMARY:');
console.log('1. Check theme verification above');
console.log('2. Check if CSS hover rules exist');
console.log('3. Check selector matching results');
console.log('4. Check for conflicting rules');
console.log('5. Try hovering to see live detection');
console.log('6. Nuclear test should force hover effects');
console.log('\nIf nuclear test works but normal hover doesn\'t, we have a specificity issue.');
console.log('If nuclear test doesn\'t work, we have a deeper CSS or DOM issue.');
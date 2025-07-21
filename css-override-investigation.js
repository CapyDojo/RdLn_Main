// CSS Override Investigation - Find the exact source of the problem
console.log('🕵️ CSS OVERRIDE INVESTIGATION - DEEP DIVE');

// Get the first visible input panel for testing
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
const testPanel = Array.from(inputPanels).find(panel => panel.offsetParent !== null);

if (!testPanel) {
  console.error('No visible input panel found for testing');
  throw new Error('No test panel available');
}

console.log('🎯 Test Panel:', testPanel);
console.log('Classes:', testPanel.className);

// INVESTIGATION 1: Check for inline styles
console.log('\n📋 INVESTIGATION 1: INLINE STYLES CHECK');
console.log('Inline style attribute:', testPanel.getAttribute('style') || 'none');

// INVESTIGATION 2: Get ALL CSS rules that apply to this element
console.log('\n📋 INVESTIGATION 2: ALL APPLICABLE CSS RULES');

function getMatchingCSSRules(element) {
  const matchingRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText) {
          try {
            if (element.matches(rule.selectorText)) {
              matchingRules.push({
                selector: rule.selectorText,
                specificity: calculateSpecificity(rule.selectorText),
                cssText: rule.cssText,
                style: rule.style,
                sheet: sheet.href || 'inline',
                boxShadow: rule.style.boxShadow,
                transform: rule.style.transform,
                borderColor: rule.style.borderColor,
                background: rule.style.background
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
  
  return matchingRules.sort((a, b) => b.specificity - a.specificity);
}

function calculateSpecificity(selector) {
  let specificity = 0;
  
  // Count IDs
  specificity += (selector.match(/#/g) || []).length * 100;
  
  // Count classes, attributes, and pseudo-classes
  specificity += (selector.match(/\.|:|\\[/g) || []).length * 10;
  
  // Count element names
  specificity += (selector.match(/^[a-zA-Z]|\\s[a-zA-Z]/g) || []).length * 1;
  
  // Add for html tag
  if (selector.includes('html')) specificity += 1;
  
  return specificity;
}

const allRules = getMatchingCSSRules(testPanel);
console.log(`Found ${allRules.length} CSS rules that apply to this element:`);

allRules.forEach((rule, index) => {
  if (rule.boxShadow || rule.transform || rule.borderColor || rule.background) {
    console.log(`\n${index + 1}. Specificity: ${rule.specificity}`);
    console.log(`   Selector: ${rule.selector}`);
    console.log(`   Box-shadow: ${rule.boxShadow || 'none'}`);
    console.log(`   Transform: ${rule.transform || 'none'}`);
    console.log(`   Border-color: ${rule.borderColor || 'none'}`);
    console.log(`   Background: ${rule.background || 'none'}`);
    console.log(`   Source: ${rule.sheet}`);
  }
});

// INVESTIGATION 3: Check computed styles cascade
console.log('\n📋 INVESTIGATION 3: COMPUTED STYLES CASCADE');

const computedStyle = getComputedStyle(testPanel);
console.log('Current computed styles:');
console.log('- Box-shadow:', computedStyle.boxShadow);
console.log('- Transform:', computedStyle.transform);
console.log('- Border-color:', computedStyle.borderColor);
console.log('- Background:', computedStyle.background);

// INVESTIGATION 4: Test hover state with maximum specificity
console.log('\n📋 INVESTIGATION 4: MAXIMUM SPECIFICITY HOVER TEST');

// Create the most specific selector possible
const maxSpecificitySelector = `html[data-theme="kyoto"] body [data-input-panel] .glass-panel.glass-content-panel.shadow-lg.transition-all.duration-300.overflow-hidden`;

console.log('Testing with maximum specificity selector:', maxSpecificitySelector);
console.log('Elements matching max selector:', document.querySelectorAll(maxSpecificitySelector).length);

// Test if our element matches this selector
console.log('Test panel matches max selector:', testPanel.matches(maxSpecificitySelector));

// Create test style with maximum specificity
const maxSpecStyle = document.createElement('style');
maxSpecStyle.id = 'max-specificity-test';
maxSpecStyle.textContent = `
  ${maxSpecificitySelector}:hover {
    box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
    border-color: rgba(220, 8, 8, 0.6) !important;
    transform: translateY(-2px) !important;
    background: rgba(28, 25, 23, var(--glass-focus)) !important;
  }
`;

document.head.appendChild(maxSpecStyle);
console.log('Maximum specificity hover rule added');

// INVESTIGATION 5: Check for CSS variables that might be overriding
console.log('\n📋 INVESTIGATION 5: CSS VARIABLES CHECK');

const cssVars = [
  '--glass-focus',
  '--glass-panel',
  '--glass-strong',
  '--glass-subtle'
];

cssVars.forEach(varName => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName);
  console.log(`${varName}: ${value || 'not defined'}`);
});

// INVESTIGATION 6: Check for transform override rules
console.log('\n📋 INVESTIGATION 6: TRANSFORM OVERRIDE INVESTIGATION');

// Look for rules that specifically disable transforms
const transformRules = allRules.filter(rule => 
  rule.transform === 'none' || 
  rule.selector.includes('input-panel') ||
  rule.selector.includes('output-panel')
);

console.log(`Found ${transformRules.length} rules that might disable transforms:`);
transformRules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector} - Transform: ${rule.transform}`);
  console.log(`   Specificity: ${rule.specificity}`);
});

// INVESTIGATION 7: Live hover test
console.log('\n📋 INVESTIGATION 7: LIVE HOVER TEST');

console.log('Hover over the test panel now and check the console...');

let hoverTestActive = true;
const hoverInterval = setInterval(() => {
  if (!hoverTestActive) return;
  
  const currentComputed = getComputedStyle(testPanel);
  const isHovered = testPanel.matches(':hover');
  
  if (isHovered) {
    console.log('🖱️ HOVER DETECTED!');
    console.log('- Box-shadow during hover:', currentComputed.boxShadow);
    console.log('- Transform during hover:', currentComputed.transform);
    console.log('- Border-color during hover:', currentComputed.borderColor);
    console.log('- Background during hover:', currentComputed.background);
    
    // Check which rules are actually being applied during hover
    const hoverRules = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.includes(':hover')) {
            try {
              if (testPanel.matches(rule.selectorText.replace(':hover', ''))) {
                hoverRules.push({
                  selector: rule.selectorText,
                  specificity: calculateSpecificity(rule.selectorText),
                  boxShadow: rule.style.boxShadow
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
    
    hoverRules.sort((a, b) => b.specificity - a.specificity);
    console.log('Hover rules that should apply (by specificity):');
    hoverRules.forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.selector} (${rule.specificity}) - ${rule.boxShadow || 'no box-shadow'}`);
    });
    
    hoverTestActive = false;
  }
}, 100);

// Stop the hover test after 30 seconds
setTimeout(() => {
  hoverTestActive = false;
  clearInterval(hoverInterval);
  
  // Clean up test styles
  if (document.getElementById('max-specificity-test')) {
    document.head.removeChild(document.getElementById('max-specificity-test'));
  }
  
  console.log('\n🎯 INVESTIGATION COMPLETE');
  console.log('If you hovered over the panel, check the hover detection results above.');
  console.log('The investigation should reveal exactly what is overriding our CSS rules.');
}, 30000);

console.log('\n⏰ Hover test will run for 30 seconds. Hover over the input panel to see live results.');
console.log('Investigation will auto-complete and clean up after 30 seconds.');
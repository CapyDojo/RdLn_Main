// CSS Specificity Test
console.log('🔍 CSS SPECIFICITY TEST');

// Find all input panels
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// Check which CSS rules are being applied
function getAppliedCSSRules(element) {
  const sheets = document.styleSheets;
  const matchedRules = [];
  
  for (const sheet of sheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        try {
          if (rule.selectorText && element.matches(rule.selectorText)) {
            // Check if this rule has box-shadow or transform properties
            if (rule.style.boxShadow || rule.style.transform) {
              matchedRules.push({
                selector: rule.selectorText,
                specificity: calculateSpecificity(rule.selectorText),
                boxShadow: rule.style.boxShadow,
                transform: rule.style.transform,
                important: rule.style.getPropertyPriority('box-shadow') === 'important'
              });
            }
          }
        } catch (e) {
          // Skip rules with syntax errors
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  // Sort by specificity
  return matchedRules.sort((a, b) => b.specificity - a.specificity);
}

// Calculate specificity (very simplified)
function calculateSpecificity(selector) {
  let specificity = 0;
  
  // Count IDs
  specificity += (selector.match(/#/g) || []).length * 100;
  
  // Count classes, attributes, and pseudo-classes
  specificity += (selector.match(/\.|\\:|\\[/g) || []).length * 10;
  
  // Count element names and pseudo-elements
  specificity += (selector.match(/\\w+|::/g) || []).length * 1;
  
  // Add for html tag
  if (selector.includes('html')) {
    specificity += 1;
  }
  
  // Add for [data-theme]
  if (selector.includes('[data-theme')) {
    specificity += 10;
  }
  
  // Add for [data-input-panel]
  if (selector.includes('[data-input-panel')) {
    specificity += 10;
  }
  
  // Add for !important
  if (selector.includes('!important')) {
    specificity += 1000;
  }
  
  return specificity;
}

// Test each panel
inputPanels.forEach((panel, index) => {
  console.log(`\n📋 Panel ${index + 1}:`);
  
  // Get all rules that apply to this panel
  const rules = getAppliedCSSRules(panel);
  
  console.log(`Found ${rules.length} matching rules with box-shadow or transform:`);
  rules.forEach((rule, i) => {
    console.log(`${i + 1}. Specificity: ${rule.specificity}, Selector: ${rule.selector}`);
    console.log(`   Box-Shadow: ${rule.boxShadow || 'none'} ${rule.important ? '(!important)' : ''}`);
    console.log(`   Transform: ${rule.transform || 'none'}`);
  });
  
  // Get computed style
  const style = getComputedStyle(panel);
  console.log('\nComputed style:');
  console.log(`Box-Shadow: ${style.boxShadow}`);
  console.log(`Transform: ${style.transform}`);
  
  // Test hover
  console.log('\nSimulating hover...');
  const hoverStyle = document.createElement('style');
  hoverStyle.textContent = `
    [data-input-panel] .glass-panel.glass-content-panel:nth-of-type(${index + 1}):hover {
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
    }
  `;
  document.head.appendChild(hoverStyle);
  
  // Check if our style is applied
  console.log('Hover style added, check if panel shows strong shadow on hover');
  
  // Clean up after 5 seconds
  setTimeout(() => {
    document.head.removeChild(hoverStyle);
    console.log(`Hover style removed from panel ${index + 1}`);
  }, 5000);
});

// Check for conflicting rules
console.log('\n🔍 CHECKING FOR CONFLICTING RULES:');
const allRules = [];

for (const sheet of document.styleSheets) {
  try {
    const rules = sheet.cssRules || sheet.rules;
    for (const rule of rules) {
      try {
        if (rule.selectorText && 
            (rule.selectorText.includes('kyoto') || 
             rule.selectorText.includes('data-input-panel')) && 
            (rule.style.boxShadow || rule.style.transform)) {
          allRules.push({
            selector: rule.selectorText,
            specificity: calculateSpecificity(rule.selectorText),
            boxShadow: rule.style.boxShadow,
            transform: rule.style.transform,
            important: rule.style.getPropertyPriority('box-shadow') === 'important'
          });
        }
      } catch (e) {
        // Skip rules with syntax errors
      }
    }
  } catch (e) {
    // Skip cross-origin stylesheets
  }
}

// Sort by specificity
allRules.sort((a, b) => b.specificity - a.specificity);

console.log(`Found ${allRules.length} rules related to Kyoto or input panels:`);
allRules.forEach((rule, i) => {
  console.log(`${i + 1}. Specificity: ${rule.specificity}, Selector: ${rule.selector}`);
  console.log(`   Box-Shadow: ${rule.boxShadow || 'none'} ${rule.important ? '(!important)' : ''}`);
  console.log(`   Transform: ${rule.transform || 'none'}`);
});
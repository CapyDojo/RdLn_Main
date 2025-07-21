// Kyoto Panel Hover Debug Script
// Following CSS Debug Protocol to systematically diagnose hover issues

console.log('🔍 CSS DEBUG: Kyoto Panel Hover Issue');

// 1. INSPECT FIRST, CODE SECOND
console.log('\n📋 STEP 1: DOM STRUCTURE INSPECTION');

// Find all input panels
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// Check DOM structure
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1} DOM structure:`);
  console.log('- Tag:', panel.tagName);
  console.log('- ID:', panel.id || 'none');
  console.log('- Classes:', panel.className);
  console.log('- Data attributes:', Array.from(panel.attributes)
    .filter(attr => attr.name.startsWith('data-'))
    .map(attr => `${attr.name}="${attr.value}"`)
    .join(', ') || 'none');
  
  // Check parent structure
  let parent = panel.parentElement;
  let parentChain = [];
  let depth = 0;
  
  while (parent && depth < 5) {
    parentChain.push({
      tag: parent.tagName,
      id: parent.id || 'none',
      classes: parent.className,
      dataAttrs: Array.from(parent.attributes)
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(', ') || 'none'
    });
    parent = parent.parentElement;
    depth++;
  }
  
  console.log('- Parent chain:');
  parentChain.forEach((p, i) => {
    console.log(`  ${i + 1}. <${p.tag.toLowerCase()}> #${p.id} .${p.classes} ${p.dataAttrs}`);
  });
});

// 2. IDENTIFY THE REAL PROBLEM
console.log('\n📋 STEP 2: COMPUTED STYLES INSPECTION');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const computedStyle = getComputedStyle(testPanel);
  
  console.log('Default computed styles:');
  console.log('- Box-shadow:', computedStyle.boxShadow);
  console.log('- Transform:', computedStyle.transform);
  console.log('- Border-color:', computedStyle.borderColor);
  console.log('- Background:', computedStyle.background);
  console.log('- Transition:', computedStyle.transition);
  
  // Check if element is visible
  const isVisible = testPanel.offsetParent !== null;
  const rect = testPanel.getBoundingClientRect();
  console.log('- Visibility check:');
  console.log('  - Is visible:', isVisible);
  console.log('  - Dimensions:', `${rect.width}x${rect.height}`);
  console.log('  - Position:', `(${rect.left}, ${rect.top})`);
}

// 3. VERIFY SELECTOR TARGETING
console.log('\n📋 STEP 3: SELECTOR VERIFICATION');

// Test different selectors to see which ones match our panels
const selectors = [
  '.glass-panel',
  '.glass-panel.glass-content-panel',
  '[data-input-panel] .glass-panel',
  '[data-input-panel] .glass-panel.glass-content-panel',
  '[data-theme="kyoto"] .glass-panel',
  '[data-theme="kyoto"] .glass-panel.glass-content-panel',
  '[data-theme="kyoto"] [data-input-panel] .glass-panel',
  '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel',
  'html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel',
  'div[data-input-panel] .glass-panel.glass-content-panel'
];

console.log('Testing selectors against input panels:');
selectors.forEach(selector => {
  const matches = document.querySelectorAll(selector);
  console.log(`- "${selector}": ${matches.length} matches`);
});

// 4. CSS RULE ANALYSIS
console.log('\n📋 STEP 4: CSS RULE ANALYSIS');

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
            background: rule.style.background,
            important: {
              boxShadow: rule.style.getPropertyPriority('box-shadow') === 'important',
              transform: rule.style.getPropertyPriority('transform') === 'important',
              borderColor: rule.style.getPropertyPriority('border-color') === 'important',
              background: rule.style.getPropertyPriority('background') === 'important'
            },
            source: sheet.href || 'inline',
            cssText: rule.cssText
          });
        }
      }
    } catch (e) {
      // Skip cross-origin stylesheets
    }
  }
  
  return matchingRules;
}

// Find all hover rules
const hoverRules = findCSSRules(':hover');
console.log(`Found ${hoverRules.length} hover rules in total`);

// Find Kyoto hover rules
const kyotoHoverRules = hoverRules.filter(rule => rule.selector.includes('kyoto'));
console.log(`Found ${kyotoHoverRules.length} Kyoto hover rules:`);

kyotoHoverRules.forEach((rule, index) => {
  console.log(`\n${index + 1}. ${rule.selector}`);
  console.log(`   Box-shadow: ${rule.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
  console.log(`   Transform: ${rule.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
  console.log(`   Border-color: ${rule.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
  console.log(`   Background: ${rule.background || 'none'} ${rule.important.background ? '!important' : ''}`);
  console.log(`   Source: ${rule.source}`);
});

// 5. SPECIFICITY ANALYSIS
console.log('\n📋 STEP 5: SPECIFICITY ANALYSIS');

function calculateSpecificity(selector) {
  // Simple specificity calculator
  let specificity = 0;
  
  // Count IDs (most specific)
  specificity += (selector.match(/#[a-zA-Z0-9_-]+/g) || []).length * 100;
  
  // Count classes, attributes, and pseudo-classes
  specificity += (selector.match(/\.[a-zA-Z0-9_-]+|\[[^\]]*\]|:[a-zA-Z0-9_-]+/g) || []).length * 10;
  
  // Count element names (least specific)
  specificity += (selector.match(/^[a-zA-Z0-9_-]+|\s[a-zA-Z0-9_-]+/g) || []).length * 1;
  
  return specificity;
}

// Calculate specificity for all Kyoto hover rules
kyotoHoverRules.forEach((rule, index) => {
  const specificity = calculateSpecificity(rule.selector);
  console.log(`${index + 1}. "${rule.selector}" - Specificity: ${specificity}`);
});

// 6. HOVER TEST
console.log('\n📋 STEP 6: HOVER TEST');
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
      console.log('- Background:', computedStyle.background);
      
      // Check if our clean hierarchy is working
      const isStrongShadow = computedStyle.boxShadow.includes('80px') || 
                            computedStyle.boxShadow.includes('64px') ||
                            computedStyle.boxShadow.includes('0.7');
      
      const hasTransform = computedStyle.transform.includes('matrix') || 
                          computedStyle.transform.includes('translateY');
      
      if (isStrongShadow && hasTransform) {
        console.log('✅ SUCCESS! Hover effect is working correctly!');
      } else {
        console.log('❌ FAILURE! Hover effect is not working correctly.');
        console.log('Expected strong shadow and transform, but they\'re not being applied.');
      }
      
      // Check which rules are actually being applied
      console.log('\nChecking which rules are being applied:');
      const matchingRules = kyotoHoverRules.filter(rule => {
        try {
          return panel.matches(rule.selector);
        } catch (e) {
          return false;
        }
      });
      
      console.log(`${matchingRules.length} matching hover rules for this element:`);
      matchingRules.forEach((rule, idx) => {
        console.log(`${idx + 1}. ${rule.selector}`);
      });
      
      hoverTestActive = false;
      break;
    }
  }
}, 100);

// 7. MANUAL HOVER SIMULATION
console.log('\n📋 STEP 7: MANUAL HOVER SIMULATION');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Simulating hover on first panel...');
  
  // Create a test style to simulate hover
  const hoverTestStyle = document.createElement('style');
  hoverTestStyle.id = 'hover-test-style';
  hoverTestStyle.textContent = `
    /* Force hover state on first panel */
    [data-input-panel] .glass-panel.glass-content-panel:first-of-type {
      box-shadow: rgba(220, 8, 8, 0.7) 0px 30px 80px 0px, rgba(220, 8, 8, 0.5) 0px 12px 40px 0px !important;
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
    console.log('- Background:', hoverComputedStyle.background);
    
    // Clean up
    document.head.removeChild(hoverTestStyle);
    console.log('\n🧹 Test style removed');
  }, 1000);
}

// 8. MEDIA QUERY CHECK
console.log('\n📋 STEP 8: MEDIA QUERY CHECK');
console.log('Current window width:', window.innerWidth);
console.log('Desktop view (>= 1024px):', window.innerWidth >= 1024);
console.log('Mobile view (< 1024px):', window.innerWidth < 1024);

// 9. HOVER-FROM-HANDLE TEST
console.log('\n📋 STEP 9: HOVER-FROM-HANDLE TEST');

// Find hover-from-handle rules
const handleHoverRules = findCSSRules('hover-from-handle');
console.log(`Found ${handleHoverRules.length} hover-from-handle rules:`);

handleHoverRules.forEach((rule, index) => {
  console.log(`\n${index + 1}. ${rule.selector}`);
  console.log(`   Box-shadow: ${rule.boxShadow || 'none'} ${rule.important.boxShadow ? '!important' : ''}`);
  console.log(`   Transform: ${rule.transform || 'none'} ${rule.important.transform ? '!important' : ''}`);
  console.log(`   Border-color: ${rule.borderColor || 'none'} ${rule.important.borderColor ? '!important' : ''}`);
  console.log(`   Background: ${rule.background || 'none'} ${rule.important.background ? '!important' : ''}`);
  console.log(`   Source: ${rule.source}`);
});

// Test hover-from-handle class
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('\nTesting hover-from-handle class on first panel...');
  
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
    console.log('- Background:', handleHoverStyle.background);
    
    // Restore original class
    testPanel.className = originalClass;
    console.log('\n🧹 Hover-from-handle class removed');
  }, 1000);
}

// 10. CSS VARIABLES CHECK
console.log('\n📋 STEP 10: CSS VARIABLES CHECK');

if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  const computedStyle = getComputedStyle(testPanel);
  
  // Check CSS variables
  const cssVars = [
    '--glass-panel',
    '--glass-focus',
    '--glass-subtle',
    '--glass-strong',
    '--glass-shadow',
    '--gradient-accent',
    '--semantic-glassPanelHover',
    '--semantic-glassPanelHoverBorder',
    '--semantic-glassPanelHoverShadow'
  ];
  
  console.log('CSS variables:');
  cssVars.forEach(variable => {
    console.log(`- ${variable}: ${computedStyle.getPropertyValue(variable) || 'not set'}`);
  });
}

// Auto-stop after 30 seconds
setTimeout(() => {
  hoverTestActive = false;
  clearInterval(hoverInterval);
  console.log('\n⏰ Debug script completed (30s timeout)');
}, 30000);

console.log('\n⏰ Debug script will run for 30 seconds');
console.log('🖱️ Please hover over input panels during this time to test the hover effect');
// CSS Debug Protocol - Systematic CSS Debugging
console.log('🔍 CSS DEBUG PROTOCOL - SYSTEMATIC APPROACH');

// STEP 1: INSPECT FIRST, CODE SECOND
console.log('\n📋 STEP 1: DOM INSPECTION');

// Find target elements
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels (expected: 4)`);

// Check computed styles on target elements
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  console.log('- Element:', panel);
  console.log('- Classes:', panel.className);
  
  const computedStyle = getComputedStyle(panel);
  console.log('- Computed box-shadow:', computedStyle.boxShadow);
  console.log('- Computed transform:', computedStyle.transform);
  console.log('- Computed border-color:', computedStyle.borderColor);
  console.log('- Computed background:', computedStyle.background);
});

// Verify which elements are actually visible/rendered
console.log('\n👁️ VISIBILITY CHECK:');
inputPanels.forEach((panel, index) => {
  const isVisible = panel.offsetParent !== null;
  const rect = panel.getBoundingClientRect();
  console.log(`Panel ${index + 1}: visible=${isVisible}, dimensions=${rect.width}x${rect.height}`);
});

// STEP 2: IDENTIFY THE REAL PROBLEM
console.log('\n🎯 STEP 2: ROOT CAUSE ANALYSIS');

// Count how many elements match our selector
const kyotoHoverSelector = 'html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel';
const matchingElements = document.querySelectorAll(kyotoHoverSelector);
console.log(`Elements matching our Kyoto selector: ${matchingElements.length} (expected: 4)`);

// Check if mobile/desktop elements are both rendered simultaneously
const mobileElements = document.querySelectorAll('.lg\\:hidden [data-input-panel]');
const desktopElements = document.querySelectorAll('.hidden.lg\\:block [data-input-panel]');
console.log(`Mobile input elements: ${mobileElements.length}`);
console.log(`Desktop input elements: ${desktopElements.length}`);

// Verify media queries are working as expected
const windowWidth = window.innerWidth;
const isDesktop = windowWidth >= 1024;
console.log(`Window width: ${windowWidth}px, Desktop view: ${isDesktop}`);

// Check CSS specificity conflicts
console.log('\n⚖️ CSS SPECIFICITY ANALYSIS:');

function getAllCSSRules() {
  const allRules = [];
  
  for (const sheet of document.styleSheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          allRules.push({
            selector: rule.selectorText,
            cssText: rule.cssText,
            style: rule.style,
            sheet: sheet.href || 'inline'
          });
        }
      }
    } catch (e) {
      console.log(`Skipped stylesheet: ${sheet.href || 'cross-origin'}`);
    }
  }
  
  return allRules;
}

// Find all rules that could affect our input panels
const allRules = getAllCSSRules();
const relevantRules = allRules.filter(rule => {
  const selector = rule.selector.toLowerCase();
  return (
    selector.includes('glass-panel') && 
    (selector.includes('hover') || selector.includes('shadow')) &&
    (selector.includes('kyoto') || selector.includes('input-panel') || selector.includes('content-panel'))
  );
});

console.log(`Found ${relevantRules.length} potentially relevant CSS rules:`);
relevantRules.forEach((rule, index) => {
  console.log(`${index + 1}. ${rule.selector}`);
  console.log(`   Box-shadow: ${rule.style.boxShadow || 'none'}`);
  console.log(`   Transform: ${rule.style.transform || 'none'}`);
  console.log(`   Important: ${rule.style.getPropertyPriority('box-shadow') === 'important' ? 'YES' : 'NO'}`);
  console.log(`   Source: ${rule.sheet}`);
});

// STEP 3: VERIFY SELECTOR TARGETING
console.log('\n🎯 STEP 3: SELECTOR VERIFICATION');

// Test our intended selectors
const testSelectors = [
  '[data-theme="kyoto"] .glass-panel:hover',
  '[data-theme="kyoto"] .glass-panel.glass-content-panel:hover',
  '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover',
  'html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover',
  '.glass-panel.shadow-lg:hover'
];

testSelectors.forEach(selector => {
  try {
    const matches = document.querySelectorAll(selector);
    console.log(`"${selector}" matches: ${matches.length} elements`);
  } catch (e) {
    console.log(`"${selector}" - INVALID SELECTOR: ${e.message}`);
  }
});

// Check for duplicate elements (mobile + desktop)
console.log('\n📱💻 MOBILE/DESKTOP ELEMENT CHECK:');
const allGlassPanels = document.querySelectorAll('.glass-panel.glass-content-panel');
console.log(`Total glass content panels: ${allGlassPanels.length}`);

allGlassPanels.forEach((panel, index) => {
  const isInInputPanel = panel.closest('[data-input-panel]');
  const isInMobile = panel.closest('.lg\\:hidden');
  const isInDesktop = panel.closest('.hidden.lg\\:block');
  
  console.log(`Panel ${index + 1}:`);
  console.log(`  In input panel: ${!!isInInputPanel}`);
  console.log(`  In mobile container: ${!!isInMobile}`);
  console.log(`  In desktop container: ${!!isInDesktop}`);
  console.log(`  Visible: ${panel.offsetParent !== null}`);
});

// STEP 4: SYSTEMATIC APPROACH CHECKLIST
console.log('\n✅ STEP 4: SYSTEMATIC CHECKLIST');

// DOM Inspection
console.log('✅ DOM Inspection: How many elements match the selector?');
console.log(`   Result: ${matchingElements.length} elements match our Kyoto selector`);

// Visibility Check
console.log('✅ Visibility Check: Which elements are actually visible?');
const visiblePanels = Array.from(inputPanels).filter(panel => panel.offsetParent !== null);
console.log(`   Result: ${visiblePanels.length} panels are visible`);

// Media Query Test
console.log('✅ Media Query Test: Are breakpoints working correctly?');
console.log(`   Result: Window is ${windowWidth}px, desktop=${isDesktop}`);

// Class Verification
console.log('✅ Class Verification: Do elements have expected classes?');
inputPanels.forEach((panel, index) => {
  const hasGlassPanel = panel.classList.contains('glass-panel');
  const hasContentPanel = panel.classList.contains('glass-content-panel');
  const hasShadowLg = panel.classList.contains('shadow-lg');
  console.log(`   Panel ${index + 1}: glass-panel=${hasGlassPanel}, glass-content-panel=${hasContentPanel}, shadow-lg=${hasShadowLg}`);
});

// Specificity Check
console.log('✅ Specificity Check: What CSS rules are actually being applied?');
console.log(`   Result: Found ${relevantRules.length} relevant rules (see above)`);

// STEP 5: HOVER STATE TESTING
console.log('\n🖱️ STEP 5: HOVER STATE TESTING');

// Test hover on first panel
if (inputPanels.length > 0) {
  const testPanel = inputPanels[0];
  console.log('Testing hover state on first panel...');
  
  // Simulate hover by adding :hover styles temporarily
  const testStyle = document.createElement('style');
  testStyle.id = 'hover-test-style';
  testStyle.textContent = `
    [data-input-panel] .glass-panel.glass-content-panel:first-of-type:hover {
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
      border-color: rgba(220, 8, 8, 0.6) !important;
      transform: translateY(-2px) !important;
    }
  `;
  
  document.head.appendChild(testStyle);
  
  // Check computed style after adding our test rule
  setTimeout(() => {
    const newComputedStyle = getComputedStyle(testPanel);
    console.log('After adding test hover rule:');
    console.log('- Box-shadow:', newComputedStyle.boxShadow);
    console.log('- Transform:', newComputedStyle.transform);
    console.log('- Border-color:', newComputedStyle.borderColor);
    
    // Clean up
    document.head.removeChild(testStyle);
    console.log('Test style removed');
  }, 100);
}

console.log('\n🎯 DIAGNOSIS COMPLETE');
console.log('Check the output above to identify the root cause of the CSS issue.');
console.log('Look for:');
console.log('- Unexpected number of matching elements');
console.log('- CSS rules with higher specificity');
console.log('- Missing or incorrect classes');
console.log('- Media query issues');
console.log('- Conflicting !important declarations');
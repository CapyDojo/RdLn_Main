// Classic Dark Glass Panel Inheritance Test
// Validates that segmented controls properly inherit from glass panel system

console.log('🌑 CLASSIC DARK GLASS PANEL INHERITANCE TEST');
console.log('Testing architectural fix for header card transparency');

// Test 1: Glass Panel System Integration
console.log('\n1️⃣ GLASS PANEL SYSTEM INTEGRATION:');

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'classic-dark') {
  console.log('⚠️ Please switch to Classic Dark theme for accurate testing');
}

// Test 2: Required CSS Variables Check
console.log('\n2️⃣ REQUIRED CSS VARIABLES:');

const rootStyle = getComputedStyle(document.documentElement);
const requiredVariables = {
  '--theme-glass-panel-bg-rgb': 'Glass panel background RGB',
  '--theme-glass-panel-border-rgb': 'Glass panel border RGB', 
  '--glass-panel': 'Glass panel opacity',
  '--glass-focus': 'Glass focus opacity'
};

let variablesValid = true;

Object.entries(requiredVariables).forEach(([variable, description]) => {
  const value = rootStyle.getPropertyValue(variable);
  if (value && value.trim()) {
    console.log(`✅ ${variable}: ${value.trim()} (${description})`);
  } else {
    console.log(`❌ ${variable}: Missing (${description})`);
    variablesValid = false;
  }
});

console.log(`\nVariable Status: ${variablesValid ? '✅ All required variables present' : '❌ Missing variables detected'}`);

// Test 3: Glass Panel Background Calculation
console.log('\n3️⃣ GLASS PANEL BACKGROUND CALCULATION:');

const glassBgRgb = rootStyle.getPropertyValue('--theme-glass-panel-bg-rgb').trim();
const glassOpacity = rootStyle.getPropertyValue('--glass-panel').trim();

if (glassBgRgb && glassOpacity) {
  const expectedBackground = `rgba(${glassBgRgb}, ${glassOpacity})`;
  console.log(`Expected glass panel background: ${expectedBackground}`);
  
  // Test actual glass panel
  const glassPanels = document.querySelectorAll('.glass-panel');
  if (glassPanels.length > 0) {
    const actualBackground = window.getComputedStyle(glassPanels[0]).background;
    console.log(`Actual glass panel background: ${actualBackground}`);
    
    const hasCorrectOpacity = actualBackground.includes(glassOpacity) || actualBackground.includes('0.18');
    const hasCorrectRgb = actualBackground.includes('38, 38, 38');
    
    console.log(`✅ Opacity check: ${hasCorrectOpacity ? 'Correct' : 'Incorrect'}`);
    console.log(`✅ RGB check: ${hasCorrectRgb ? 'Correct' : 'Incorrect'}`);
    
    if (hasCorrectOpacity && hasCorrectRgb) {
      console.log('✅ Glass panel background is correctly calculated');
    } else {
      console.log('❌ Glass panel background calculation issue detected');
    }
  } else {
    console.log('⚠️ No glass panels found for testing');
  }
} else {
  console.log('❌ Cannot calculate expected background - missing variables');
}

// Test 4: Segmented Control Inheritance
console.log('\n4️⃣ SEGMENTED CONTROL INHERITANCE:');

const segmentedControls = document.querySelectorAll('.segmented-control');
console.log(`Found ${segmentedControls.length} segmented controls`);

if (segmentedControls.length > 0) {
  const control = segmentedControls[0];
  const controlStyle = window.getComputedStyle(control);
  
  console.log('Segmented Control Styling:');
  console.log(`- Background: ${controlStyle.background}`);
  console.log(`- Border: ${controlStyle.border}`);
  
  // Check if it's using the glass panel system variables
  const usesGlassPanelBg = controlStyle.background.includes('38, 38, 38') || 
                           controlStyle.background.includes('255, 255, 255');
  
  console.log(`Uses glass panel system: ${usesGlassPanelBg ? '✅' : '❌'}`);
  
  // Test inheritance from parent glass panel
  const parentGlassPanel = control.closest('.glass-panel');
  if (parentGlassPanel) {
    const parentStyle = window.getComputedStyle(parentGlassPanel);
    console.log(`Parent glass panel background: ${parentStyle.background}`);
    console.log('✅ Segmented control is inside glass panel - inheritance possible');
  } else {
    console.log('⚠️ Segmented control not inside glass panel');
  }
}

// Test 5: Header Card Transparency Fix
console.log('\n5️⃣ HEADER CARD TRANSPARENCY FIX:');

// Look for header elements that should have glass panel styling
const headerElements = document.querySelectorAll('header.glass-panel, .floating-header .glass-panel, [class*="header"] .glass-panel');
console.log(`Found ${headerElements.length} header glass panel elements`);

headerElements.forEach((header, index) => {
  const headerStyle = window.getComputedStyle(header);
  const background = headerStyle.background;
  
  console.log(`Header ${index + 1}:`);
  console.log(`- Background: ${background}`);
  
  const isTransparent = background.includes('rgba(0, 0, 0, 0)') || 
                       background.includes('transparent') ||
                       background === 'none';
  
  const hasCorrectOpacity = background.includes('0.18') || background.includes('0.1');
  
  console.log(`- Is transparent: ${isTransparent ? '❌ YES (Problem!)' : '✅ NO (Good)'}`);
  console.log(`- Has opacity: ${hasCorrectOpacity ? '✅ YES' : '❌ NO'}`);
  
  if (!isTransparent && hasCorrectOpacity) {
    console.log('✅ Header transparency fixed');
  } else {
    console.log('❌ Header transparency issue persists');
  }
});

// Test 6: Architecture Compliance
console.log('\n6️⃣ ARCHITECTURE COMPLIANCE:');

// Check that we're not overriding the glass panel system
const hasThemeSpecificSegmentedRules = document.styleSheets && 
  Array.from(document.styleSheets).some(sheet => {
    try {
      return Array.from(sheet.cssRules || []).some(rule => 
        rule.selectorText && 
        rule.selectorText.includes('classic-dark') && 
        rule.selectorText.includes('.segmented-control') &&
        rule.style.background
      );
    } catch (e) {
      return false;
    }
  });

console.log(`Theme-specific segmented control overrides: ${hasThemeSpecificSegmentedRules ? '❌ Present (Bad)' : '✅ Removed (Good)'}`);

// Test 7: Cascade Order Validation
console.log('\n7️⃣ CASCADE ORDER VALIDATION:');

const testElement = document.createElement('div');
testElement.className = 'glass-panel';
testElement.style.position = 'absolute';
testElement.style.top = '-9999px';
document.body.appendChild(testElement);

const testStyle = window.getComputedStyle(testElement);
const testBackground = testStyle.background;

console.log(`Test glass panel background: ${testBackground}`);

const cascadeWorking = testBackground.includes('38, 38, 38') && 
                      (testBackground.includes('0.18') || testBackground.includes('0.1'));

console.log(`CSS cascade working: ${cascadeWorking ? '✅ YES' : '❌ NO'}`);

document.body.removeChild(testElement);

console.log('\n🏁 GLASS PANEL INHERITANCE TEST COMPLETE');

// Summary
console.log('\n📊 SUMMARY:');
console.log('This test validates that the architectural fix:');
console.log('1. Removes CSS specificity conflicts');
console.log('2. Enables proper glass panel inheritance');
console.log('3. Fixes header card transparency');
console.log('4. Maintains theme visual consistency');